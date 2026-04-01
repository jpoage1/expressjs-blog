import shutil

from pipeline_runner.lib.types import Stage
from pipeline_runner.lib.task_types import SuiteTask


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
