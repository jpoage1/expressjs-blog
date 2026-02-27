import os
import subprocess
import time
import tomllib
import socket
from lupa import LuaRuntime
from pathlib import Path
from lib.task_types import SuiteTask
from lib.types import Stage


class GetDeploymentConfig(SuiteTask):

    _stage = Stage.BOOTSTRAP
    _deps = []

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.name = "Get the deployment configuration"

    def _run(self):
        # 1. Load Lua
        lua = LuaRuntime(unpack_returned_tuples=True)
        with open(self.get_arg("config"), "r") as f:
            module = lua.execute(f.read())

        # 2. Call the factory
        target_env = self.get_arg("branch").split("/")[-1]  # e.g., 'main' or 'testing'
        print(target_env)

        # 3. Hydrate self.env
        config = module.get_config(target_env)

        self.env.build_dir = Path(config.paths.build)
        self.env.release_dir = Path(config.paths.release_dir)
        self.env.deploy_path = Path(config.paths.deploy_link)
        self.env.service = config.systemd.service_name
        self.env.config_file_source = config.paths.config_file
        self.env.meta = config.meta

        self.print(f"✅ Context hydrated for {config.meta.app_name}:{target_env}")
        return True


class LoadServerConfig(SuiteTask):
    """Fails the pipeline if the required TOML config is missing from the host"""

    _stage = Stage.BOOTSTRAP

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.name = "Verify the server's toml configuration exists"


class VerifyConfigExists(SuiteTask):
    """Verifies TOML existence and hydrates the environment with health check URI components"""

    _stage = Stage.BOOTSTRAP

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.name = "Verify and Hydrate Server Configuration"

    def _run(self):
        # 1. Physical existence check
        config_path = self.env.config_file_source
        self.print(f"  [CHECK] Verifying configuration: {config_path}")

        if not os.path.exists(config_path):
            self.fail(
                f"CRITICAL: Configuration file not found at {config_path}. "
                "Pipeline terminated to prevent application misbehavior."
            )

        # 2. Parse TOML for internal deployment metadata
        try:
            with open(config_path, "rb") as f:
                data = tomllib.load(f)

            server = data.get("server", {})

            # 3. Hydrate self.env for HealthCheck and WaitForReadiness tasks
            self.env.server_schema = server.get("schema")
            self.env.server_address = server.get("address")
            self.env.server_port = str(server.get("port"))
            self.env.server_health_path = server.get("health_check")

            # Construct the dynamic URI used by curl in later stages
            self.env.test_endpoint_uri = (
                f"{self.env.server_schema}://{self.env.server_address}:"
                f"{self.env.server_port}{self.env.server_health_path}"
            )

            self.print(
                f"  [READY] Health check URI constructed: {self.env.test_endpoint_uri}"
            )

        except Exception as e:
            self.fail(f"FAILED to parse TOML at {config_path}: {e}")

        self.print("  [OK] Configuration verified and environment hydrated.")
        return True


class YarnBuild(SuiteTask):
    """Executes dependency installation and asset compilation"""

    _stage = Stage.BUILD
    _deps = [GetDeploymentConfig, VerifyConfigExists]
    skip: bool = False

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.name = "Running Yarn build process"

    def _run(self):
        build_dir = self.env.build_dir
        self.sh(
            f"git clone --branch {self.env.deploy_branch} {self.get_arg('repo')} {build_dir}"
        )
        self.sh("git submodule update --init --recursive", cwd=build_dir)
        self.sh("yarn install", cwd=build_dir)
        self.sh("yarn combine:css", cwd=build_dir)


class AtomicDeploy(SuiteTask):
    """Performs rsync to release directory and updates environment symlink"""

    _stage = Stage.DEPLOY
    _deps = [YarnBuild]
    skip: bool = False

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.name = "Executing atomic symlink swap"

    def _run(self):
        env = self.env
        self.sh(f"mkdir -p {env.release_dir}")
        self.sh(f"rsync -a --delete {env.build_dir}/ {env.release_dir}/")
        self.sh(f"ln -sfn {env.release_dir} {env.deploy_path}")
        self.sh(f"sudo systemctl restart {env.service_name}")


class HealthCheck(SuiteTask):
    """Polls the local service endpoint to verify readiness"""

    _stage = Stage.DEPLOY
    _deps = [AtomicDeploy]
    skip: bool = False

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.name = "Verifying service health"

    def _run(self):
        self.msg(self.name)
        if self.do_dry_run:
            return
        for i in range(15):
            res = subprocess.run(
                ["curl", "-s", "-I", self.env.test_endpoint_uri],
                capture_output=True,
            )
            if res.returncode == 0:
                self.print("✅ Service is healthy")
                return True
            time.sleep(2)
        self.fail("Service failed health check after 30 seconds")
