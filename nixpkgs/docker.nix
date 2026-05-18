{
  pkgs ? import <nixpkgs> {},
  lib,
  stdenv,
  expressjs-blog,
  ...
} @ params: let
  bundle = expressjs-blog.bundle.override {portable = false;};

  configPath = "/etc/expressjs-blog/config.json";

  blogInit = ''
    set -x
    mkdir -p /var/lib/expressjs-blog
    mkdir -p /var/log/expressjs-blog

    INIT_FLAG="/app/.initialized"

    if [ ! -f "$INIT_FLAG" ]; then
      echo "[INIT] First-time setup: Running migrations and seeds..."
      expressjs-blog migrate-up --config ${configPath}
      expressjs-blog seed --config ${configPath}
      touch "$INIT_FLAG"
    fi

    exec expressjs-blog start --config ${configPath}
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
    name = "expressjs-blog.docker";
    tag = "latest";
    created = "now";

    copyToRoot = pkgs.buildEnv {
      name = "expressjs-blog.docker-image";
      paths = dockerPkgs;
      pathsToLink = ["/bin" "/lib" "/share" "/etc"];
    };

    config = {
      Cmd = ["entrypoint.sh"];
      WorkingDir = "/app";

      Env = with expressjs-blog; [
        "HOME=/root"
        "PATH=${pkgs.lib.makeBinPath dockerPkgs}"
      ];

      Volumes = {
        "/var/lib/expressjs-blog" = {};
        "/etc/expressjs-blog" = {};
      };
    };
  }
