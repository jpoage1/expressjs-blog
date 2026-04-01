import time
from typing import TYPE_CHECKING

from pipeline_runner.lib.types import typename
from pipeline_runner.lib.task_types import SuiteTask, Task as BaseTask, SuiteSubTask


if TYPE_CHECKING:
    from deployment_pipeline.core.suite import DeploymentSuite
    from deployment_pipeline.lib.task_types import BlogDeploySuite


class DeploymentTask(BaseTask):
    pass


class DeploymentSuiteTask(SuiteTask):
    _owner: "BlogDeploySuite"
    _parent: "DeploymentTask"

    def skip_task(self):
        if self._deps and not self.deps_loaded():
            self.print(f"  [INFO] Skipping {self.name}: Dependencies not met.")
            return True
        if self.skip:
            return True

        return False

    def run(self):
        self.print("Running ", typename(self))
        try:
            if len(self._deps) > 0:

                from deployment_pipeline.core.task_runner import TaskRunner

                TaskRunner.add_deps(self)
                TaskRunner.run_deps(self)
        except Exception as e:
            raise Exception(f"Failed to load dependency for {typename(self)}: {e}")
        return self._run()

    def deps_loaded(self):
        if isinstance(self, SuiteSubTask):
            return True

        from deployment_pipeline.core.task_runner import TaskRunner

        return TaskRunner.is_loaded(self._deps)

    def poll_health_endpoint(self, uri, retries=5, delay=5, label="Service"):
        """Shared polling logic for verifying service availability"""
        self.print(f"  [POLL] Verifying {label} Health: {uri}")

        if self.do_dry_run():
            retries = 0

        for _ in range(retries):
            try:
                # Use sh to maintain consistency in logs/dry-runs
                # We use graceful=False but handle the boolean return in the loop
                res = self.sh(
                    f"curl -s -I {uri} | grep '200 OK'", handle_exception=False
                )

                if res and res.returncode == 0:
                    self.print(f"  [OK] {label} is healthy.")
                    return True
                else:
                    self.print("Got result :", res)
            except Exception as e:

                self.print(f"  [WAIT] {label} not ready... {e}")
                self.print(e.__dict__)

            time.sleep(delay)

        return False


class DeploymentSubTask(SuiteSubTask):
    _owner: "DeploymentSuite"
    _parent: DeploymentSuiteTask

    def run(self):
        self.print("Running ", typename(self))
        try:
            if len(self._deps) > 0:

                from deployment_pipeline.core.task_runner import TaskRunner

                TaskRunner.load_deps(
                    self,
                    self._deps,
                )
        except Exception as e:
            raise Exception(f"Failed to load dependency for {typename(self)}: {e}")
        return self._run()
