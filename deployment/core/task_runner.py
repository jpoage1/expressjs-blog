from typing import List

from lib.types import Stage
from lib.errors import TaskError
from lib.task_types import SuiteTask

from core.bootstrap import *
from core.task_runner import *
from core.suite import *
from core.tests import *

from core.tasks import (
    GetDeploymentConfig,
    LoadServerConfig,
    YarnBuild,
    AtomicDeploy,
    HealthCheck,
)


class TaskRunner(SuiteTask):
    _stage = Stage.BOOTSTRAP
    skip: list | None
    tasks: list | None  # Input from cli
    _all_tasks: List[SuiteTask]
    _queue: List = []

    def __init__(
        self,
        *args,
        owner: "DeploymentSuite",
        skip: list | None = None,
        tasks: list | None = None,
        stage: Stage = Stage.ANY,
        **kwargs,
    ):
        super().__init__(owner, *args, owner=owner, **kwargs)
        self.last_task = None
        self.disable_dry_run()

        self.name = "Task Runner"
        self._skip = skip
        self._all_tasks = []
        self.tasks = tasks
        self.current_stage = stage

        all_tasks = [
            CheckNix,
            VerifySystemDependencies,
            GetDeploymentConfig,
            LoadServerConfig,
            EnsureBuildPaths,
            YarnBuild,
            TestRunner,
            AtomicDeploy,
            HealthCheck,
            # DetermineRoot,
            # VerifyEnvironment,
            # EnsureBuildPaths,
            # RunUnitTests,
            # UpdateVersion,
            # BuildServer,
            # StartServer,
        ]
        for _task in all_tasks:

            task = _task(owner, *args, owner=owner, **kwargs)
            self._all_tasks.append(task)

    @staticmethod
    def is_loaded(deps: List[type[SuiteTask]]):
        """
        Validates if all required task types exist in the TaskRunner queue.
        TaskRunner.queue is expected to be a set or list of SuiteTask instances.
        """
        # Extract the classes of the tasks currently in the queue
        queued_task_types = {type(task) for task in TaskRunner._queue}

        # Returns True if every dependency class is found in the queued types
        return all(dep in queued_task_types for dep in deps)

    def _run(self):
        if self._owner is None:
            raise ValueError("Owner is not set")
        if self._parent is None:
            raise ValueError("Parent is not set")
        all_tasks = self._all_tasks

        if self.tasks is not None and len(self.tasks) > 0:
            TaskRunner._queue = [all_tasks[i] for i in self.tasks if i < len(all_tasks)]
        else:
            skip_set = self._skip or set()
            TaskRunner._queue = [
                task for i, task in enumerate(all_tasks) if i not in skip_set
            ]
        queue = TaskRunner._queue

        num_tasks = len(queue)
        if num_tasks < 1:
            self.print(all_tasks)
            self.print(queue)
            self.print(self.tasks)
            self.print(self.skip_task())
            self.fail("No tasks queued.")

        self.print(f"Queue initialized with {len(queue)} tasks")

        # Execute the filtered queue
        for task in queue:
            self.last_task = task.name
            try:
                # current_stage = self.current_stage
                # task_stage = task.get_stage()
                # if task_stage is not current_stage:
                #     continue
                if task.run() is False:
                    self.fail(f"Pipeline stopped at task: {task.name}")
            except ModuleNotFoundError as e:
                self.print(f"  [ERROR] Task {task.name} failed: {e}")
                self.fail(f"Pipeline stopped at task: {self.last_task}")
            except TaskError as e:
                self.print(f"  [ERROR] Task {task.name} failed: {e}")
                self.fail(f"Pipeline stopped at task: {self.last_task}")
