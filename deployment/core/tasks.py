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
        config_path = self.get_arg("config")

        with open(config_path, "r") as f:
            module = lua.execute(f.read())

        # 2. Determine environment key from branch
        # Mapping 'main' to 'release' as per lua schema
        branch = self.get_arg("branch").split("/")[-1]
        target_env = "release" if branch == "main" else branch

        if target_env not in module:
            self.fail(f"Environment '{target_env}' not defined in {config_path}")

        # 3. Extract environment specific sub-table
        cfg = module[target_env]

        # 4. Hydrate self.env
        self.env.lua_cfg = cfg  # Store the lua object for functional calls later
        self.env.app_name = module.app_name
        self.env.repo = module.repo
        self.env.timestamp_format = module.timestamp_format

        self.env.deploy_path = Path(cfg.deploy_link)
        self.env.service_name = cfg.service_name
        self.env.config_file_source = Path(cfg.config_file)
        self.env.retention_count = cfg.count
        self.env.deploy_branch = branch

        self.print(f"✅ Context hydrated for {self.env.app_name}:{target_env}")
        # self.env.build_dir = Path(config.paths.build)
        return True


class LoadServerConfig(SuiteTask):
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
        # Use a temporary build directory with -BUILDING suffix
        # This is finalized in AtomicDeploy
        timestamp = time.strftime(self.env.timestamp_format)
        self.env.release_dir = Path(self.env.lua_cfg.get_release_dir(timestamp))
        self.env.build_dir = self.env.release_dir.with_name(
            self.env.release_dir.name + "-BUILDING"
        )

        self.print(f"  [BUILD] Target: {self.env.build_dir}")

        self.sh(
            f"git clone --branch {self.env.deploy_branch} {self.env.repo} {self.env.build_dir}"
        )
        self.sh("git submodule update --init --recursive", cwd=self.env.build_dir)
        self.sh("yarn install", cwd=self.env.build_dir)
        self.sh("yarn combine:css", cwd=self.env.build_dir)
        return True


class AtomicDeploy(SuiteTask):
    """Performs rsync to release directory and updates environment symlink"""

    _stage = Stage.DEPLOY
    _deps = [YarnBuild]
    skip: bool = False

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.name = "Executing atomic symlink swap"

    def _run(self):
        # 1. Finalize the directory name (remove -BUILDING)
        self.sh(f"mv {self.env.build_dir} {self.env.release_dir}")

        # 2. Atomic Symlink Swap
        temp_link = self.env.deploy_path.with_name(self.env.deploy_path.name + "_tmp")
        self.sh(f"ln -sfn {self.env.release_dir} {temp_link}")
        self.sh(f"mv -Tf {temp_link} {self.env.deploy_path}")

        # 3. Restart Service
        self.sh(f"sudo systemctl restart {self.env.service_name}")

        self.print(f"🚀 Deployed to {self.env.deploy_path} -> {self.env.release_dir}")
        return True


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
