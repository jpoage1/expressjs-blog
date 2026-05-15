#!/usr/bin/env python
import os
import sys
import subprocess
import argparse


class ContainerManager:
    def __init__(self, repo_name: str, git_repo: str, git_commit: str):
        self.repo_name = repo_name
        self.git_repo = git_repo
        self.git_commit = git_commit

    def build(self) -> None:
        """Builds the docker image utilizing host networking."""
        cmd = [
            "docker",
            "build",
            "--network=host",
            "--build-arg",
            f"GIT_REPO={self.git_repo}",
            "--build-arg",
            f"GIT_COMMIT={self.git_commit}",
            "-t",
            f"{self.repo_name}:latest",
            ".",
        ]
        self._execute(cmd)

    def run(self) -> None:
        """Executes podman run with the --replace flag."""
        cmd = [
            "podman",
            "run",
            "-d",
            "--replace",
            "--name",
            "blog-test",
            "-p",
            "3000:3000",
            f"localhost/{self.repo_name}:latest",
        ]
        self._execute(cmd)

    def logs(self) -> None:
        """Streams container logs to stdout."""
        cmd = ["podman", "logs", "-f", "blog-test"]
        self._execute(cmd)

    def clean(self) -> None:
        """Removes the test container and prunes all local images."""
        print("[*] Cleaning container storage...")
        subprocess.run(["podman", "rm", "-f", "blog-test"], check=False)
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


def ensure_root() -> None:
    """Forces re-execution with sudo if euid is not 0."""
    if os.geteuid() != 0:
        os.execvp("sudo", ["sudo", sys.executable] + sys.argv)


def main() -> None:
    ensure_root()

    manager = ContainerManager(
        repo_name="jpoage1/expressjs-blog",
        git_repo="https://github.com/jpoage1/expressjs-blog",
        git_commit="main",
    )

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

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    dispatch[args.command]()


if __name__ == "__main__":
    main()
