self: super: let
  # Internal definitions using self to ensure fix-point evaluation
  frontend = self.callPackage ./frontend {};
  api-server = self.callPackage ./src/api-server/package.nix {inherit frontend;};
  core = self.callPackage ./core {};
  tools = self.callPackage ./tools {};

  # Docker specific logic
  dockerEntrypoint = self.writeShellScriptBin "entrypoint.sh" ''
    mkdir -p /var/lib/tailscale
    # 1. Start tailscaled in userspace mode (no /dev/net/tun needed)
    ${self.tailscale}/bin/tailscaled --tun=userspace-networking --socks5-server=localhost:1055 --statedir=/var/lib/tailscale &

    # 2. Authenticate and bring the node online
    ${self.tailscale}/bin/tailscale up --authkey=$TS_AUTHKEY --hostname=hexascript-dev
    ${self.tailscale}/bin/tailscale serve --bg 8000

    # 3. Start your api_server
    exec ${api-server}/bin/hexascript_api_server
  '';

  dockerPkgs = [
    self.bashInteractive
    self.busybox
    self.tailscale
    api-server
    frontend
    core
    dockerEntrypoint
  ];
in {
  # Exposed attributes
  hexascript-frontend = frontend;
  hexascript-api-server = api-server;
  hexascript-core = core;
  hexascript-tools = tools;

  hexascript-suite = self.symlinkJoin {
    name = "hexascript-full-suite";
    paths = [
      api-server
      frontend
      core
      tools
    ];
    meta = with self.lib; {
      description = "Complete Hexascript Orchestration Suite";
      platforms = platforms.linux;
    };
  };

  hexascript-docker = self.dockerTools.buildImage {
    name = "hexascript-service";
    tag = "latest";
    created = "now";
    copyToRoot = self.buildEnv {
      name = "image-root";
      paths = dockerPkgs;
      pathsToLink = ["/bin" "/lib" "/share"];
    };

    config = {
      Cmd = ["entrypoint.sh"];
      WorkingDir = "/app";
      Env = [
        "PATH=${self.lib.makeBinPath dockerPkgs}"
        "PYTHONPATH=${api-server}/${self.python3.sitePackages}:${core}/lib"
      ];
    };
  };
}
