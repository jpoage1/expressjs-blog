from os import wait
from typing import List

from lib.types import Stage, typename
from lib.errors import TaskError
from lib.task_types import SuiteTask

from core.bootstrap import *
from core.task_runner import *
from core.suite import *


from core.tasks import (
    GetDeploymentConfig,
    LoadServerConfig,
    HotFix,
    YarnBuild,
    AtomicDeploy,
    HealthCheck,
    PipelineSuccess,
)


class TaskRunner(SuiteTask):
    _stage = Stage.BOOTSTRAP
    skip: list | None
    tasks: list | None  # Input from cli
    _all_tasks: List[SuiteTask]
    _queue: List = []
    _loaded: dict = {}
    _initialized: bool = False
    base_class_name: str

    def __init__(
        self,
        *args,
        owner: "DeploymentSuite",
        skip: list | None = None,
        tasks: list | None = None,
        stage: Stage = Stage.ANY,
        base_class_name="TaskRunner",
        **kwargs,
    ):
        super().__init__(owner, *args, owner=owner, **kwargs)
        self.last_task = None
        self.disable_dry_run()

        self.name = "Task Runner"
        self._skip = skip
        self._all_tasks: List = []
        self.tasks = tasks
        self.current_stage = stage
        self.base_class_name = base_class_name

        def queue_tasks(all_tasks):
            return self._queue_tasks(all_tasks, *args, **kwargs)

        self.queue_tasks = queue_tasks
        if TaskRunner._initialized:
            return

        TaskRunner._initialized = True

    def _queue_tasks(self, all_tasks, *args, cls_name="SuiteTask", **kwargs):
        selected_task = self.get_arg("tasks")
        if selected_task:
            self.print("Selected Task: ", type(selected_task))
            tasks = [task for task in all_tasks if task.__name__ == selected_task]
        else:
            tasks = all_tasks

        task_suite = TaskRunner._loaded

        for _task in tasks:
            try:
                task = _task(self._owner, *args, owner=self._owner, **kwargs)
                self._all_tasks.append(task)
                task_suite[typename(task)] = task
            except Exception as e:
                raise Exception("Task initialization failed: ", e) from e
        return self

    @staticmethod
    def load_deps(parent, deps: List[SuiteTask], cls_name="SuiteTask"):
        from lib.task_types import typename

        parent.print("  Loading deps for ", typename(parent))
        for dep in deps:
            # print("test", dep)
            dep_name = dep.__name__
            parent.print("    dep: ", dep_name)
            try:
                if not TaskRunner.is_loaded(deps):
                    raise Exception("This dependency was not initialized.", deps)
                elif dep.skip:
                    raise Exception("This dependency was marked as 'skip'.")

                dep_list = TaskRunner._get_dep_list()
                # print("test", dep_list)
                if dep_name not in dep_list.keys():

                    # parent.print(f"Running {type(dep)}", end="")
                    # parent.print(f"Running {dep}", end="")

                    task = TaskRunner._get_dep(dep_name)

                    task.run()
                parent.print("Complete.")

            except Exception as e:
                raise Exception("Dependency resolution failed: ", e) from e

    @staticmethod
    def _get_dep_list():
        try:
            task_suite = TaskRunner._loaded
            # task_suite = TaskRunner._loaded.get(base_class_name)
        except AttributeError as e:
            raise Exception("Oops i messed up", e)

        if type(task_suite).__name__ != "dict":
            # print(TaskRunner._loaded)
            raise AttributeError(f"Expected a dict, got: {task_suite}: ")
        return task_suite

    @staticmethod
    def _get_dep(dep_name):
        task_suite = TaskRunner._get_dep_list()
        # print(TaskRunner._loaded)
        if len(task_suite.keys()) == 0:
            raise AttributeError(
                f"Dependency '{dep_name}' not set in {task_suite_name}", cls_name
            )
        task = task_suite.get(dep_name)
        if typename(task) not in ["SuiteTask", "SuiteSubTask"]:
            raise AttributeError(f"Dependency '{dep_name}' not found in task_suite")
        return task

    @staticmethod
    def is_loaded(deps: List[SuiteTask]):
        """
        Validates if all required task types exist in the TaskRunner queue.
        TaskRunner.queue is expected to be a set or list of SuiteTask instances.
        """
        # Extract the classes of the tasks currently in the queue
        if len(deps) == 0:
            return True
        results = []
        for dep in deps:
            # Get the base class name
            base_class = dep.__bases__[0].__name__

            # Lookup the task in that queue
            dep_list = TaskRunner._get_dep_list().values()

            dep_name_list = [type(task).__name__ for task in dep_list]

            print(dep.__name__)  # The dependency's name
            print(dep_name_list)

            # for d in dep_base_classes:

            # Is the dep in that task list?
            if dep.__name__ in dep_name_list:
                results.append(True)
        for result in results:
            if not result:
                return False

        return True

    def _sanity_check(self):
        if self._owner is None:
            raise ValueError("Owner is not set")
        if self._parent is None:
            raise ValueError("Parent is not set")

    def _run(self):
        self._sanity_check()
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

        self._runner(queue)

    def _runner(self, queue):
        # Execute the filtered queue
        selected_task = self.get_arg("task")
        for task in queue:
            from lib.task_types import typename

            task_name = typename(task)

            if selected_task is None or task_name == selected_task:
                self.last_task = task_name
                try:
                    # current_stage = self.current_stage
                    # task_stage = task.get_stage()
                    # if task_stage is not current_stage:
                    #     continue
                    if task.run() is False:
                        self.fail(f"Pipeline stopped at task: {task.name}")
                except PipelineSuccess as e:
                    self.print(e)
                    break
                except ModuleNotFoundError as e:
                    self.print(f"  [ERROR] Task {task.name} failed: {e}")
                    self.fail(f"Pipeline stopped at task: {self.last_task}")
                except TaskError as e:
                    self.print(f"  [ERROR] Task {task.name} failed: {e}")
                    self.fail(f"Pipeline stopped at task: {self.last_task}")
