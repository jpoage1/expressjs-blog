import argparse
from pathlib import Path

from lib.errors import SuiteError
from lib.task_types import SuiteTask, Task
from core.task_runner import TaskRunner
from lib.types import BuildEnv
from core.bootstrap import *
from core.task_runner import *
from core.suite import *


def load_parser():
    parser = argparse.ArgumentParser(description="Blog Deployment Suite")

    parser.add_argument("--config", required=True)
    parser.add_argument("--task", type=str, default="HealthCheck")
    parser.add_argument("--hotfix", action="store_true")
    parser.add_argument("--full-pipeline", action="store_true")
    parser.add_argument("--branch", required=True)
    parser.add_argument("--root", type=str, help="The root directory of the project")
    parser.add_argument("--stage", type=str, help="Run a specific stage of the build")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Perform a trial run without executing tasks",
    )
    print("ran parser")

    # Capture specific test names: e.g., --tests ArtifactsTest.Cleanup FullChainTest.EndToEnd
    parser.add_argument(
        "--tests",
        nargs="+",
        type=str,
        default=[],
        help="List of specific test names",
    )

    # Capture a regex filter: e.g., --filter Artifacts.*
    parser.add_argument(
        "--filter", type=str, help="Filter tests with regex (maps to ctest -R)"
    )

    # --tasks 1 2 5
    parser.add_argument("--tasks", nargs="+", type=int, help="List of task IDs to run")

    # --skip 0 3
    parser.add_argument("--skip", nargs="+", type=int, help="List of task IDs to skip")
    return parser


class DeploymentSuite(SuiteTask):
    """
    Orchestrates the Hexascript logic verification pipeline.
    Replaces tdd_loop.sh with zero subprocess overhead for Python logic.
    """

    name = "Hexa Core Test Script Runner"
    root_dir: Path | None
    _in_nix_shell: bool
    _owner: "DeploymentSuite"

    def __init__(self, *args, root: str | None = None, **kwargs):
        self.disable_dry_run()
        self.parser = None
        self._in_nix_shell = False
        self.engine = None
        self.env = BuildEnv()
        self.args: dict = dict()
        self.toml: dict = dict()

        self._owner = self
        self._parser()
        Task.owner = self
        super().__init__(self, *args, owner=self, *kwargs)

        self._parent = self

        self.root_dir = Path(root) if root else None

        self.kwargs = kwargs

    def _parser(self):

        parser = load_parser()
        self._owner.args = vars(parser.parse_args())

        def initialized():
            print("Parser already initialized")

        self._parser = initialized

    def fail(self, *args, **kwargs):
        """Helper to raise the state-aware exception."""
        raise SuiteError(self, *args, **kwargs)

    def _run(self):
        from core.tests import TestRunner

        from core.tasks import (
            GetDeploymentConfig,
            LoadServerConfig,
            HotFix,
            YarnBuild,
            AtomicDeploy,
            HealthCheck,
            PipelineSuccess,
        )

        all_tasks = [
            CheckNix,
            VerifySystemDependencies,
            GetDeploymentConfig,
            LoadServerConfig,
            HotFix,
            EnsureBuildPaths,
            YarnBuild,
            TestRunner,
            AtomicDeploy,
            HealthCheck,
        ]
        Task.__init__(self._owner, all_tasks)
        task = self.get_arg("task")
        Task.run(task)
        return self
        runner = TaskRunner(
            self, all_tasks, base_class_name="SuiteTask", owner=self._owner
        )
        runner.queue_tasks(all_tasks)
        runner.run()
