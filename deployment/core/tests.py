import time

from lib.task_types import SuiteTask, SuiteSubTask
from lib.types import Stage
from core.tasks import YarnBuild


class StartTestApp(SuiteSubTask):
    """Spins up the application in the build directory for integration testing"""

    _stage = Stage.TEST
    _deps = [YarnBuild]

    def __init__(self, *args, **kwargs):
        self.name = "Start Application for Test"
        super().__init__(*args, **kwargs)

    def _run(self):
        if self._owner.args.get("skip_tests") and not self.env.meta.get(
            "enforce_testing"
        ):
            self.print("  [SKIP] Skipping per user request.")
            return True

        self.print(f"  [EXEC] Starting app in {self.env.build_dir}")
        # Stop existing service if it's hogging the port
        self.sh(f"sudo systemctl stop {self.env.service_name} || true")

        # Start background process and record PID
        cmd = f"nohup yarn run prod >> '{self.env.meta.server_log_file}' 2>&1 & echo $! > '{self.env.pidfile}'"
        self.sh(cmd, cwd=self.env.build_dir)
        return True


class WaitForReadiness(SuiteSubTask):
    """Polls the health endpoint until the test server is responsive"""

    _stage = Stage.TEST
    _deps = [StartTestApp]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.name = "Wait for Service Readiness"

    def _run(self):
        if self._owner.args.get("skip_tests") and not self.env.meta.get(
            "enforce_testing"
        ):
            return True

        uri = self.env.test_endpoint_uri
        self.print(f"  [POLL] Waiting for {uri}...")
        # if self.do_dry_run():
        #     return

        for _ in range(15):
            # Check for 200 OK
            try:
                res = self.sh(f"curl -s -I {uri} | grep '200 OK'")
                if res:
                    self.print("  [OK] Service is UP.")
                    return True
            except Exception:
                time.sleep(2)

        self.sh(f"cat '{self.env.meta.server_log_file}'")
        self.fail(f"Service at {uri} failed to start within 30s.")


class RunMochaTests(SuiteSubTask):
    """Executes the actual test suite against the running instance"""

    _stage = Stage.TEST
    _deps = [WaitForReadiness]

    def __init__(self, *args, **kwargs):
        self.name = "Run Tests"
        super().__init__(*args, **kwargs)

    def _run(self):
        if self._owner.args.get("skip_tests") and not self.env.meta.get(
            "enforce_testing"
        ):
            return True

        self.print("  [RUN] npm run test:postreceive")
        # Using sh_thread to ensure real-time log streaming for Jenkins
        self.sh_thread("npm run test:postreceive", cwd=self.env.build_dir)
        return True


class StopTestApp(SuiteSubTask):
    """Cleans up the test process regardless of test outcome"""

    _stage = Stage.TEST
    _deps = [RunMochaTests]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.name = "Stop Test App"

    def _run(self):
        # We try to stop even if SKIP_TESTS was true to be safe
        self.print(f"  [KILL] Terminating process in {self.env.pidfile}")
        self.sh(f"kill $(cat '{self.env.pidfile}') || true")
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
        self._sub_tasks = [StartTestApp, WaitForReadiness, RunMochaTests, StopTestApp]

    def _run(self):
        # 1. Check if we should even be here
        skip_param = self.args.get("skip_tests", False)
        enforced = (self.env.meta.enforce_testing,)

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

        except Exception as e:
            success = False
            self.print(f"  [ERROR] Critical failure during test execution: {e}")

        finally:
            if self.do_dry_run():
                return
            # 3. Forced Teardown
            # If the loop broke or failed, ensure StopTestApp runs if StartTestApp was attempted
            self.print("  [CLEAN] Ensuring test environment teardown...")
            cleanup = StopTestApp(parent=self, owner=self._owner)
            cleanup.run()

        return success
