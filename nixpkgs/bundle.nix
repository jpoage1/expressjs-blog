{
  pkgs,
  lib,
  stdenv,
  makeWrapper,
  express-blog,
  python3,
  portable ? true,
  ...
}: let
  paths = express-blog.paths portable;
  pythonEnv = python3.withPackages (ps: express-blog.api-server.propagatedBuildInputs);
  api-server-bin = with paths;
    pkgs.writeTextFile {
      name = "express-blog";
      executable = false;
      text = ''
        #!/bin/bash
        exec ${yarnBin} "$@"
      '';
    };
in
  stdenv.mkDerivation {
    pname = "express-blog-${lib.optionalString (!express-blog.portable) "-nix"}";
    inherit (express-blog) version;

    # No source needed; we are just aggregating deliverables
    unpackPhase = "true";

    nativeBuildInputs = [makeWrapper];

    # Reference the completed derivations
    buildInputs = with express-blog; [
      blog-engine
    ];

    dontPatchShebangs = express-blog.portable;

    installPhase = with express-blog;
    with paths; ''
      set -x
      # Initialize FHS structure
      mkdir -p $out/bin
      mkdir -p $out/lib/express-blog
      mkdir -p $out/share/express-blog
      mkdir -p $out/etc/express-blog
      set +x
    '';

    meta = with lib; {
      description = "Consolidated Express Blog Deployment Bundle";
      platforms = platforms.linux;
    };
  }
