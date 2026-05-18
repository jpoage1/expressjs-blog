{
  pkgs,
  lib,
  stdenv,
  makeWrapper,
  expressjs-blog,
  python3,
  portable ? true,
  ...
}: let
  paths = expressjs-blog.paths portable;
  pythonEnv = python3.withPackages (ps: expressjs-blog.api-server.propagatedBuildInputs);
  api-server-bin = with paths;
    pkgs.writeTextFile {
      name = "expressjs-blog";
      executable = false;
      text = ''
        #!/bin/bash
        exec ${yarnBin} "$@"
      '';
    };
in
  stdenv.mkDerivation {
    pname = "expressjs-blog-${lib.optionalString (!expressjs-blog.portable) "-nix"}";
    inherit (expressjs-blog) version;

    # No source needed; we are just aggregating deliverables
    unpackPhase = "true";

    nativeBuildInputs = [makeWrapper];

    # Reference the completed derivations
    buildInputs = with expressjs-blog; [
      blog-engine
    ];

    dontPatchShebangs = expressjs-blog.portable;

    installPhase = with expressjs-blog;
    with paths; ''
      set -x
      # Initialize FHS structure
      mkdir -p $out/bin
      mkdir -p $out/lib/expressjs-blog
      mkdir -p $out/share/expressjs-blog
      mkdir -p $out/etc/expressjs-blog
      set +x
    '';

    meta = with lib; {
      description = "Consolidated Express Blog Deployment Bundle";
      platforms = platforms.linux;
    };
  }
