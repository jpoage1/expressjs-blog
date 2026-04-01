import time
import shlex

from pipeline_runner.lib.task_types import SuiteTask, SuiteSubTask
from pipeline_runner.lib.types import Stage
from pipeline_runner.core.tasks import YarnBuild
from pipeline_runner.core.task_runner import TaskRunner


class StartTestApp(SuiteSubTask):
    """Spins up the application in the build directory for integration testing"""

    _stage = Stage.TEST
    _deps = [YarnBuild]

    def __init__(self, *args, **kwargs):
        self.name = "Start Application for Test"
        super().__init__(*args, **kwargs)

    def _run(self):
        if self._owner.args.get("skip_tests") and not self.get_arg("enforce_testing"):
            self.print("  [SKIP] Skipping per user request.")
            return True

        self.print(f"  [EXEC] Starting app in {self.env.build_dir}")

        cmd = f"nohup sudo -u {self.env.user} yarn run prod --config {self.env.testing.config_file} >> '{self.env.test_log}' 2>&1 & echo $! > '{self.env.pidfile}'"
        # This doesn't work because systemd doesnt know where it is yet
        # cmd=f"sudo systemctl restart {self.env.testing.service_name}",
        self.sh(
            cmd,
            cwd=self.env.build_dir,
            # shlex=True,
        )
        return True


class WaitForReadiness(SuiteSubTask):
    """Polls the health endpoint of the TEST instance"""

    _stage = Stage.TEST
    _deps = [StartTestApp]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.name = "Wait for Service Readiness"

    def _run(self):
        if self._owner.args.get("skip_tests") and not self.get_arg(
            "enforce_testing", True
        ):
            return True

        uri = self.env.toml["testing"]["network"]["health_endpoint"]

        status = self.poll_health_endpoint(uri, label="Test Service")
        if self.do_dry_run():
            return
        if not status:
            # If the poll fails, we cat the log as requested before failing
            self.sh(f"cat '{self.env.test_log}'", disabled=True)
            self.fail(f"Test service at {uri} failed to start.")

        return True


class RunMochaTests(SuiteSubTask):
    """Executes the actual test suite against the running instance"""

    _stage = Stage.TEST
    _deps = [WaitForReadiness]

    def __init__(self, *args, **kwargs):
        self.name = "Run Tests"
        super().__init__(*args, **kwargs)

    def _run(self):
        if self._owner.args.get("skip_tests") and not self.get_arg("enforce_testing"):
            return True

        # Using sh_thread to ensure real-time log streaming for Jenkins
        self.sh_thread("yarn test:postreceive", cwd=self.env.build_dir)
        return True


class StopTestApp(SuiteSubTask):
    """Cleans up the test process regardless of test outcome"""

    _stage = Stage.TEST
    _deps = [RunMochaTests]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.name = "Stop Test App"

    def _run(self):
        self.sh(f"whoami")
        self.sh(f"id")
        self.sh(f"kill $(cat '{self.env.pidfile}') || true", shlex=False)
        # self.sh(
        #     f"sudo systemctl stop {self.env.testing.service_name}",
        #     shlex=False,
        # )
        return True


class TestRunner(SuiteTask):
    """
    Sub-orchestrator for the Integration Testing lifecycle.
    Manages the environment setup, execution, and teardown for Mocha tests.
    """

    _stage = Stage.TEST
    _deps = []  # Dependent on YarnBuild completion in the main TaskRunner
    skip: bool = False

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.name = "Integration Test Runner"
        sub_tasks = [StartTestApp, WaitForReadiness, RunMochaTests, StopTestApp]

        runner = TaskRunner(self, owner=self._owner, base_class_name="TestRunner")
        runner.queue_tasks(sub_tasks).run()

    def _run(self):

        # 1. Check if we should even be here
        skip_param = self.args.get("skip_tests", False)
        enforced = self.get_arg("enforce_testing")

        if skip_param and not enforced:
            self.print("  [SKIP] Integration tests bypassed by user flag.")
            return True

        self.print(f"--- Entering Stage: {self._stage.value.upper()} ---")

        # 2. Sequential Execution
        # We manually iterate to maintain control over the 'StopTestApp' cleanup
        success = True
        try:
            for task_class in self._sub_tasks:
                # Instantiate as SubTask to maintain ID hierarchy (e.g., [4.1], [4.2])
                task = task_class(parent=self, owner=self._owner)

                if task.run() is False:
                    success = False
                    self.print(f"  [FAIL] Test suite halted at: {task.name}")
                    break

        except AttributeError as e:
            success = False
            self.fail(f"  [ERROR] failure during test execution: {e}")
        except Exception as e:
            success = False
            self.fail(f"  [ERROR] Critical failure during test execution: {e}")

        finally:
            if not self.do_dry_run():
                # 3. Forced Teardown
                # If the loop broke or failed, ensure StopTestApp runs if StartTestApp was attempted
                self.print("  [CLEAN] Ensuring test environment teardown...")
                cleanup = StopTestApp(parent=self, owner=self._owner)
                cleanup.run()
                self.env.test_success = success
