{
  pkgs ? import <nixpkgs> {},
  lib,
  stdenv,
  express-blog,
  ...
} @ params: let
  bundle = express-blog.bundle.override {portable = false;};

  configPath = "/etc/express-blog/config.json";

  blogInit = ''
    set -x
    mkdir -p /var/lib/express-blog
    mkdir -p /var/log/express-blog

    INIT_FLAG="/app/.initialized"

    if [ ! -f "$INIT_FLAG" ]; then
      echo "[INIT] First-time setup: Running migrations and seeds..."
      express-blog migrate-up --config ${configPath}
      express-blog seed --config ${configPath}
      touch "$INIT_FLAG"
    fi

    exec express-blog start --config ${configPath}
  '';
  entrypoint = pkgs.writeShellScriptBin "entrypoint.sh" ''
    ${blogInit}
  '';
  dockerPkgs = with pkgs; [
    bashInteractive
    busybox
    entrypoint
    bundle
    curl
  ];
in
  pkgs.dockerTools.buildImage {
    name = "express-blog.docker";
    tag = "latest";
    created = "now";

    copyToRoot = pkgs.buildEnv {
      name = "express-blog.docker-image";
      paths = dockerPkgs;
      pathsToLink = ["/bin" "/lib" "/share" "/etc"];
    };

    config = {
      Cmd = ["entrypoint.sh"];
      WorkingDir = "/app";

      Env = with express-blog; [
        "HOME=/root"
        "PATH=${pkgs.lib.makeBinPath dockerPkgs}"
      ];

      Volumes = {
        "/var/lib/express-blog" = {};
        "/etc/express-blog" = {};
      };
    };
  }
