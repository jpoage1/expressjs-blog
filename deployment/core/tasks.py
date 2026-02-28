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
            cfg = lua.execute(f.read())

        # 4. Hydrate self.env
        self.env.lua_cfg = cfg  # Store the lua object for functional calls later
        self.env.app_name = cfg.app_name
        self.env.repo = cfg.repo
        self.env.timestamp_format = cfg.timestamp_format

        self.env.deploy_branch = self.get_arg("branch").split("/")[-1]
        self.env.release = cfg.release
        self.env.testing = cfg.testing

        self.print(f"✅ Context hydrated for {self.env.app_name}")
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
        self.env.toml["release"] = self.get_config("release")
        self.env.toml["testing"] = self.get_config("testing")

    def get_config(self, env_type):
        config_file = getattr(self.env, env_type).config_file

        self.print(f"  [CHECK] Verifying {env_type} configuration: {config_file}")

        if not os.path.exists(config_file):
            self.fail(f"CRITICAL: {env_type} config not found at {config_file}.")
        # 1. Physical existence check

        # 2. Parse TOML for internal deployment metadata
        try:
            with open(config_file, "rb") as f:
                data = tomllib.load(f)

            return {
                "public": self.get_server_cfg(data, "public"),
                "network": self.get_server_cfg(data, "network"),
            }

        except Exception as e:
            self.fail(f"FAILED to parse {env_type} TOML: ", e)

    def get_server_cfg(self, data, server_type):
        try:
            server = data.get(server_type)

            # 3. Hydrate self.env for HealthCheck and WaitForReadiness tasks
            config = {
                "schema": server.get("schema"),
                "domain": server.get("domain"),
                "address": server.get("address"),
                "port": str(server.get("port")),
            }
            health_path = data.get("meta").get("health_check")

            if server_type == "network":
                config["loc"] = config.get("address")
            elif server_type == "public":
                config["loc"] = config.get("domain")

            config["health_endpoint"] = (
                f"{config['schema']}://{config['loc']}:"
                f"{config['port']}{health_path}"
            )

            self.print(
                f"  [READY] {server_type} Health URI: {config['health_endpoint']}"
            )
            return config

        except Exception as e:
            self.fail(f"FAILED to parse {server_type} TOML: ", e)


class PipelineSuccess(Exception):
    pass


class HotFix(SuiteTask):
    """Bypasses the full build to update the current live deployment"""

    _stage = Stage.DEPLOY

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.name = "Hot fix"

    def _run(self):
        if not self.get_arg("hotfix"):
            return

        cfg = self.env.release
        # 1. Target the current active symlink
        live_path = self.env.release.deploy_link

        # 2. Pull changes
        try:
            self.sh(
                "git pull origin " + self.env.deploy_branch,
                cwd=live_path,
                handle_exception=False,
            )
        except:
            self.sh("git fetch origin ", cwd=live_path)
            self.sh("git reset --hard origin/" + self.env.deploy_branch, cwd=live_path)

        # 3. Quick Asset Rebuild (Skip yarn install unless package.json changed)
        # We check for changes in package.json to decide if we need a full install
        self.sh("yarn combine:css", cwd=live_path)

        # 4. Restart to pick up Node.js changes
        self.sh(f"sudo systemctl restart {cfg.service_name}")

        raise PipelineSuccess("Hot fix applied successfully")


class YarnBuild(SuiteTask):
    """Executes dependency installation and asset compilation"""

    _stage = Stage.BUILD
    _deps = [GetDeploymentConfig, LoadServerConfig]
    skip: bool = False

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.name = "Running Yarn build process"

    def _run(self):
        timestamp = time.strftime(self.env.timestamp_format)
        self.env.release_dir = f"{Path(self.env.testing.deploy_link)}-{timestamp}"

        self.sh(
            f"git clone --branch {self.env.deploy_branch} {self.env.repo} {self.env.build_dir}"
        )
        self.sh("git submodule update --init --recursive", cwd=self.env.build_dir)
        self.sh("yarn config set enableGlobalCache false", cwd=self.env.build_dir)
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
        # Determine success from the TestRunner flag
        test_success = getattr(self.env, "test_success", False)

        # Select appropriate Lua config table
        cfg = self.env.release if test_success else self.env.testing

        # Generate the versioned directory path using Lua function
        # Note: Use the actual formatted timestamp, not the format string
        timestamp = time.strftime(self.env.timestamp_format)
        final_release_dir = Path(cfg.get_release_dir(timestamp))

        # 1. Finalize the directory (Rename from -BUILDING to versioned path)
        self.sh(f"mv {self.env.build_dir} {final_release_dir}")

        # 2. Atomic Symlink Swap - ONLY if tests passed
        if test_success:
            deploy_link = Path(cfg.deploy_link)
            # Create a temporary symlink name in the same parent directory
            temp_link = deploy_link.with_name(deploy_link.name + "_tmp")

            # Create temporary symlink pointing to the new version
            self.sh(f"ln -sfn {final_release_dir} {temp_link}")

            # Atomic rename of the symlink itself (overwrites the old link)
            self.sh(f"mv -Tf {temp_link} {deploy_link}")

            # Restart service
            self.sh(f"sudo systemctl restart {cfg.service_name}")
        else:
            self.print("  [SKIP] Test failure detected. Symlink swap bypassed.")
            self.print(f"  [INFO] Artifact preserved at: {final_release_dir}")

        return True


class HealthCheck(SuiteTask):
    """Polls the local production service endpoint"""

    _stage = Stage.DEPLOY
    _deps = [AtomicDeploy]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.name = "Verifying service health"

    def _run(self):
        # Base run handles dry_run check already
        uri = self.env.toml["release"]["network"]["health_endpoint"]

        status = self.poll_health_endpoint(uri, label="Production Service")
        if self.do_dry_run():
            return
        if not status:
            self.fail(f"Production service failed health check at {uri}")

        return True
