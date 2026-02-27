import os
from enum import Enum
from pathlib import Path


class Stage(Enum):
    ANY = "any"
    BOOTSTRAP = "bootstrap"
    BUILD = "build"
    TEST = "test"
    DEPLOY = "deploy"


class BuildEnv:
    timestamp_format: str = "%Y%m%d-%H%M%S"
    workspace: Path
    timestamp: str
    deploy_branch: str
    deploy_path: Path
    build_dir: Path
    service_name: str
    release_dir: Path
    test_endpoint_uri: str
    pidfile: Path = Path()

    def __init__(self, timestamp_format: str | None = None):
        self.workspace: Path = Path()
        self.timestamp: str = ""
        self.deploy_branch: str = ""
        self.deploy_path: Path = Path()
        self.build_dir: Path = Path()
        self.service_name: str = ""
        self.release_dir: Path = Path()
        self.server_schema = "http"
        self.server_address = "localhost"
        self.pidfile = Path("/tmp/hexascript_test.pid")

        self.root_dir = os.getcwd()
        if timestamp_format is not None:
            self.timestamp_format = timestamp_format
        self.workspace = Path(os.getenv("WORKSPACE", self.root_dir))
        self.build_dir = self.workspace / "build"
