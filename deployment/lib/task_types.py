import threading
import os
import sys
import subprocess
from pathlib import Path
from abc import ABC, abstractmethod
from typing import List, TYPE_CHECKING

from lib.printer import Printer
from lib.errors import TaskError


if TYPE_CHECKING:
    from types import Stage, BuildEnv
    from task_types import BlogDeploySuite


class SuiteTask(ABC):
    _owner: "BlogDeploySuite"
    _parent: "SuiteTask"
    _global_counter: int = 0
    _id: int
    _cwd: Path | None
    message: str
    name: str
    printer: Printer
    skip: bool = False
    _can_skip: bool = True
    _stage: "Stage"
    _initialized = False
    _deps = []
    env: "BuildEnv"

    def __init__(
        self,
        parent,
        *args,
        owner: "TDDSuite",
        cwd: Path | str | None = None,
        attach_printer: bool = True,
        **kwargs,
    ):
        from lib.task_types import SuiteTask

        if owner is None and not SuiteTask._initialized:
            raise ValueError("Owner is not set")
        if parent is None:
            raise ValueError("Parent is not set")
        if kwargs and self.__class__.__name__ in kwargs.get("skip"):
            self.skip = True
            return
        SuiteTask._initialized = True

        if cwd is not None:
            cwd = Path(cwd)
        if cwd is None and parent is not None:
            try:
                cwd = parent.get_cwd()
            except:
                pass
        if cwd is None:
            cwd = os.getcwd()
        self._cwd = cwd

        self._owner = owner
        self._parent = parent
        self.env = owner.env
        self.args = self._owner.args

        from lib.task_types import SuiteTask

        if not isinstance(self, SuiteSubTask):
            self._id = SuiteTask._global_counter
            SuiteTask._global_counter += 1
        if attach_printer:
            self.attach_printer(parent)

    def get_arg(self, arg):
        return self._owner.args.get(arg)

    def skip_task(self):
        if self._deps and not self.deps_loaded():
            self.print(f"  [INFO] Skipping {self.name}: Dependencies not met.")
            return True
        if self.skip:
            return True

        return False

    def get_path(self, component: str, path: Path | str | None = None) -> Path:
        if path is not None:
            return self._owner.paths.get(component) / Path(path)
        return self._owner.paths.get(component)

    def do_dry_run(self):
        do_dry_run = self.args.get("dry_run", False) or self.skip_task()
        return do_dry_run

    def attach_printer(self, parent):
        self.printer = Printer(parent, self)

    @staticmethod
    def inc_count():
        SuiteSubTask._global_counter += 1

    @staticmethod
    def get_count():
        return SuiteTask._global_counter

    def dump_print_queue(self):
        """Standardized message logger."""
        self.printer.dump()

    def print(self, *args, **kwargs):
        """Standardized message logger."""
        self.printer.print(*args, **kwargs)

    def msg(self, *args, **kwargs):
        """Standardized message logger."""
        self.printer.msg(*args, **kwargs)

    @abstractmethod
    def _run(self):
        pass

    def dry_run(self):
        self.msg(self.name)
        if self.skip_task():
            self.print("Skipping")
            return True
        return self.do_dry_run()

    def disable_dry_run(self):
        def func():
            print("Dry run disabled")
            return False

        print("Disabling dry run")
        self.do_dry_run = func

    def run(self):
        return self._run()

    def fail(self, *args, critical: bool = False, **kwargs):
        """Helper to raise the state-aware exception."""

        raise TaskError(self, critical=critical, *args, **kwargs)

    def sh(self, cmd: str, cwd: Path | None = None, graceful=False, dry_run=None):
        """Helper to run shell commands within the project context."""
        self.msg(f"  [EXEC] {cmd}")
        if self.do_dry_run and dry_run is not False:
            return

        try:
            # E: Instance of 'SuiteTask' has no 'paths' member
            return subprocess.run(
                cmd, shell=True, check=True, cwd=str(cwd or os.getcwd())
            )
        except Exception as e:
            if graceful:
                self.fail(e)
            raise Exception(e)

    def sh_thread(self, cmd: str, cwd: Path | None = None):
        """
        Runs shell commands, streams output to CLI in real-time,
        and captures it for later analysis.
        """
        self.msg(f"  [EXEC] {cmd}")
        if self.do_dry_run:
            return

        # Store captured output
        self.last_stdout = []
        self.last_stderr = []

        # Start the process with piped outputs
        process = subprocess.Popen(
            cmd,
            shell=True,
            cwd=str(cwd or self.get_path("root")),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,  # Line buffered
        )

        def stream_pipe(pipe, relay, accumulator):
            """Reads from pipe, writes to relay (stdout/err), and saves to list."""
            for line in iter(pipe.readline, ""):
                if line:
                    accumulator.append(line)
                    relay.write(line)
                    relay.flush()
            pipe.close()

        # Use threads to prevent the pipes from clogging (which causes deadlocks)
        t1 = threading.Thread(
            target=stream_pipe, args=(process.stdout, sys.stdout, self.last_stdout)
        )
        t2 = threading.Thread(
            target=stream_pipe, args=(process.stderr, sys.stderr, self.last_stderr)
        )

        t1.start()
        t2.start()

        # Wait for completion
        exit_code = process.wait()
        t1.join()
        t2.join()

        if exit_code != 0:
            self.fail(f"\n[ERROR] Command failed with code {exit_code}", code=exit_code)

        return ["".join(self.last_stdout), "".join(self.last_stdout)]

    def get_cwd(self):
        return self._cwd

    def get_id(self):
        return self._id

    def get_stage(self):
        return self._stage


class SuiteSubTask(SuiteTask):
    _owner: "TDDSuite"
    _parent: SuiteTask

    _sub_counter: dict[int] = {}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, attach_printer=False, **kwargs)

        if SuiteTask._global_counter not in SuiteSubTask._sub_counter.keys():
            SuiteSubTask._sub_counter[SuiteTask._global_counter] = 0

        self._id = (SuiteTask._global_counter, SuiteSubTask._sub_counter)

        self.attach_printer(self._owner)

        self.paths = self._owner.paths

    def msg(self, *args, **kwargs):
        """Standardized message logger."""
        SuiteSubTask.inc_count()

        self._parent.msg(*args, **kwargs)

    @staticmethod
    def inc_count():
        SuiteSubTask._sub_counter[SuiteTask._global_counter] += 1

    @staticmethod
    def get_count():
        return SuiteSubTask._sub_counter
