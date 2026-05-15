#!/usr/bin/env python
import os
import sys
import subprocess
import argparse
from pathlib import Path
from typing import Optional, Union

CONFIG_PATH_TYPE = Union[Path, str]


class ContainerNameError(Exception):
    """Raised when an operation requiring an explicit container target is missing definition."""


ERROR_TYPES = (FileNotFoundError, ContainerNameError)


class ContainerManager:
    repo_name: Optional[str] = None
    container_name: Optional[str] = None
    git_repo: Optional[str] = None
    git_commit: Optional[str] = None
    config_path: Optional[CONFIG_PATH_TYPE] = None

    def init(
        self,
        **kwargs,
    ):
        for arg_name in [
            "repo_name",
            "git_repo",
            "git_commit",
            "config_path",
            "container_name",
        ]:
            arg = kwargs.get(arg_name, None)
            if arg is not None:
                self.__setattr__(arg_name, arg)

    def set_config(self, config_path: CONFIG_PATH_TYPE) -> None:
        resolved_path = Path(config_path).resolve()
        if not resolved_path.exists():
            raise FileNotFoundError
        self.config_path = resolved_path

    def build(self) -> None:
        """Builds the docker image utilizing host networking with optional build args."""
        cmd = [
            "docker",
            "build",
            "--network=host",
        ]

        if self.git_repo:
            cmd.extend(["--build-arg", f"GIT_REPO={self.git_repo}"])

        if self.git_commit:
            cmd.extend(["--build-arg", f"GIT_COMMIT={self.git_commit}"])

        cmd.extend(
            [
                "-t",
                f"{self.repo_name}:latest",
                ".",
            ]
        )

        self._execute(cmd)

    def _ensure_container_name(self):
        if not self.container_name:
            raise ContainerNameError

    def run(self) -> None:
        """Executes podman run with the --replace flag and optional volume mapping."""
        self._ensure_container_name()

        cmd = [
            "podman",
            "run",
            "-d",
            "--replace",
            "--name",
            self.container_name,
            "-p",
            "3000:3000",
        ]

        if self.config_path:
            cmd.extend(["-v", f"{self.config_path}:/app/config.toml:Z"])

        cmd.append(f"localhost/{self.repo_name}:latest")

        self._execute(cmd)

    def logs(self) -> None:
        """Streams container logs to stdout. Fails explicitly if container_name is missing."""
        self._ensure_container_name()

        cmd = ["podman", "logs", "-f", self.container_name]
        self._execute(cmd)

    def clean(self) -> None:
        """Removes the test container and prunes all local images. Fails explicitly if container_name is missing."""
        self._ensure_container_name()

        print("[*] Cleaning container storage...")

        remove_container = ["podman", "rm", "-f", self.container_name]
        subprocess.run(remove_container, check=False)

        subprocess.run(["podman", "system", "prune", "-a", "-f"], check=True)

    def force_clean(self) -> None:
        """Forcefully removes all containers and images to reset the environment."""
        print("[*] Performing nuclear reset of Podman storage...")
        # Remove all containers first
        subprocess.run(["sudo", "podman", "rm", "-af"], check=False)
        # Remove all images
        subprocess.run(["sudo", "podman", "rmi", "-af"], check=False)
        # Final system cleanup
        subprocess.run(
            ["sudo", "podman", "system", "prune", "-a", "--volumes", "-f"], check=True
        )

    def _execute(self, command: list[str]) -> None:
        """Isolates subprocess logic to handle execution and errors."""
        try:
            subprocess.run(command, check=True)
        except subprocess.CalledProcessError as e:
            sys.stderr.write(f"Command failed: {e}\n")
            sys.exit(e.returncode)
        except FileNotFoundError as e:
            sys.stderr.write(f"Binary not found: {e.filename}\n")
            sys.exit(1)


def _ensure_root() -> None:
    """Forces re-execution with sudo if euid is not 0."""
    if os.geteuid() != 0:
        os.execvp("sudo", ["sudo", sys.executable] + sys.argv)


def main() -> None:
    _ensure_root()

    manager = ContainerManager()

    dispatch = {
        "build": manager.build,
        "run": manager.run,
        "logs": manager.logs,
        "clean": manager.clean,
        "force_clean": manager.force_clean,
    }

    parser = argparse.ArgumentParser(
        description="Python-based container lifecycle manager."
    )
    parser.add_argument(
        "command",
        choices=dispatch.keys(),
        nargs="?",
        help="Command to execute.",
    )
    parser.add_argument(
        "--name",
        help="Target container name",
    )
    parser.add_argument(
        "config",
        nargs="?",
        default="config.toml",
        help="Config file",
    )
    parser.add_argument(
        "-c",
        "--config",
        default="config.toml",
        help="Path to the application configuration file.",
    )
    parser.add_argument(
        "--repo-name",
        default="jpoage1/expressjs-blog",
        help="Target container repository name.",
    )
    parser.add_argument(
        "--git-repo",
        default="https://github.com/jpoage1/expressjs-blog",
        help="Git source repository URL.",
    )
    parser.add_argument(
        "--git-commit",
        default="main",
        help="Target git commit, branch, or identifier tag.",
    )

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    manager.init(
        repo_name=args.repo_name,
        git_repo=args.git_repo,
        git_commit=args.git_commit,
        container_name=args.name,
    )

    if args.command == "run" and args.config:
        try:
            manager.set_config(args.config)
        except FileNotFoundError as e:
            sys.stderr.write(
                f"CONFIGURATION_ERROR: Target definition file missing: {e.filename}\n"
            )
            sys.exit(1)

    try:
        dispatch[args.command]()
    except ContainerNameError:
        sys.stderr.write(
            "COMMAND_VALIDATION_ERROR: Target target execution missing parameter: container_name\n"
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
