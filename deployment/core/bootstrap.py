import os
import shutil

from lib.printer import clear_screen
from lib.types import Stage
from lib.task_types import SuiteTask, SuiteSubTask


class CheckNix(SuiteTask):
    _stage = Stage.BOOTSTRAP

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.name = "Checking if we are in a nix shell..."

    def _run(self):
        if not shutil.which("nix"):
            self.print("⬡ Nix tools not found in PATH.")
            return

        # 2. Check if already in a shell
        shell_type = os.environ.get("IN_NIX_SHELL")
        if shell_type:
            self._in_nix_shell = shell_type
        return True


class EnsureBuildPaths(SuiteTask):
    _can_skip = False
    """Task 1: Ensure build paths exist"""

    _stage = Stage.BOOTSTRAP

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.name = "Setting up bulid path"

    def _run(self):
        """Ensure build directory exists"""
        self.env.build_dir.mkdir(parents=True, exist_ok=True)


class VerifySystemDependencies(SuiteTask):
    _can_skip = False
    _stage = Stage.BOOTSTRAP

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.name = "Verifying System Dependencies"

    def _run(self):
        """Verifies non-Python dependencies required for the C++ Core."""
        if self._owner._in_nix_shell:
            self.print("Skipping: in nix shell")
            return True

        deps = ["yarn", "git", "rsync", "curl", "node"]
        for dep in deps:
            if not shutil.which(dep):
                self.fail(f"Missing system dependency: {dep}")
        self.printer.print("  [OK] System tools detected.")
        return True
