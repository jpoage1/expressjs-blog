{
  pkgs ? import <nixpkgs> {},
  archName ? "x64",
  portable ? true,
  installBase ? "/usr",
  ...
} @ params: let
  inherit (pkgs) lib;
  traceLoad = name: value: builtins.trace "Initializing Component: ${name}" value;
  blogScope = lib.makeScope pkgs.newScope (self: let
    ctx = {
      inherit (self);
      expressjs-blog = self;
      src = ./.;
    };
    dependencies = import ./nixpkgs/dependencies.nix params;
  in
    with self; {
      paths = portable:
        if portable
        then {
          pythonBin = "${installBase}/bin/yarn";
          sharePath = "${installBase}/share/expressjs-blog";
        }
        else {
          yarnBin = "${pkgs.yarn-berry}/bin/yarn";
          sharePath = "${expressjs-blog.blog-engine}/share/expressjs-blog";
        };
      # Shared Metadata
      inherit (builtins.fromJSON (builtins.readFile ./version.json)) version;
      inherit (paths portable) pythonBin sharePath;
      inherit archName portable;

      inherit (dependencies) nodePackages;
      blog-engine = traceLoad "blog-engine" (callPackage ./nixpkgs/blog-engine.nix (ctx
        // {
          enableAssetStaging = false;
        }));
      bundle = traceLoad "bundle" (callPackage ./nixpkgs/bundle.nix (ctx
        // {
          inherit archName;
          enableAssetStaging = true;
        }));
      # staticAssets = traceLoad "staticAssets" (callPackage ./nixpkgs/staticAssets.nix ctx);
      yarnCache = callPackage ./nixpkgs/yarnCache.nix (params // ctx);

      all = [
        bundle
        deb-x64
        deb-arm64
      ];

      # The final "Suite" as a symlinkJoin
      suite = pkgs.symlinkJoin {
        name = "expressjs-blog-${version}";
        paths = all;
        meta = with lib; {
          description = "Complete Express Blog Orchestration Suite";
          platforms = platforms.linux;
        };
      };

      # Function to generate a .deb for a specific architecture
      mkDeb = args: callPackage ./nixpkgs/deb.nix (ctx // args);
      deb-x64 = traceLoad "deb-x64" (mkDeb {
        targetSuite = bundle;
        archName = "amd64";
      });

      deb-arm64 = traceLoad "deb-arm64" (
        let
          armPkgs = import pkgs.path {
            system = "aarch64-linux";
            config.allowUnfree = true;
          };
          armRepo = armPkgs.callPackage ./package.nix {
            inherit
              staticPath
              ;
          };
        in
          mkDeb {
            targetSuite = armRepo.bundle;
            archName = "arm64";
          }
      );

      expressjs-blog = self;

      docker = callPackage ./nixpkgs/docker.nix ctx;
      docker-arm64 = traceLoad "docker-arm64" (
        let
          armPkgs = import pkgs.path {
            system = "aarch64-linux";
            config.allowUnfree = true;
          };
          armRepo = armPkgs.callPackage ./package.nix {};
        in
          armRepo.docker
      );
    });
in
  blogScope
