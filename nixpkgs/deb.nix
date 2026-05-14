{
  pkgs,
  targetSuite,
  archName,
  express-blog,
  nfpm,
  ...
}: let
  inherit (express-blog) version;
  postinstall = pkgs.writeText "post-install.sh" ''
    #!/bin/bash
    set -e

    REQUIREMENTS="/usr/share/express-blog/requirements.txt"

    if [ -f "$REQUIREMENTS" ]; then
      echo "Installing Python dependencies from $REQUIREMENTS via pip..."
      # --break-system-packages overrides PEP 668 external-management blocks
      python3 -m pip install --upgrade -r "$REQUIREMENTS" --break-system-packages
    else
      echo "Error: $REQUIREMENTS not found. Skipping pip installation."
      exit 1
    fi
  '';
  nfpmConfig = pkgs.writeText "nfpm-${archName}.yaml" (builtins.toJSON {
    name = "express-blog";
    arch = archName;
    platform = "linux";
    inherit version;
    maintainer = "Jason Poage <jason@jasonpoage.com>";
    description = "Complete Express Blog Orchestration Suite (${archName})";
    depends = [
      "python3 (>= 3.11)"
      "python3-pip"
      "python3-fastapi"
      "python3-uvicorn"
      "python3-pydantic"
      "python3-pydantic-settings"
      "python3-sqlalchemy"
      "python3-requests"
      "nodejs (>= 20)"
      # "libc6 (>= 2.31)"
      # "libssl3"
    ];
    scripts = {
      postinstall = "${postinstall}";
    };
    contents = [
      {
        src = "${targetSuite}/bin";
        dst = "/usr/bin";
        type = "tree";
      }
      {
        src = "${targetSuite}/lib";
        dst = "/usr/lib";
        type = "tree";
      }
      {
        src = "${targetSuite}/share";
        dst = "/usr/share";
        type = "tree";
      }
    ];
  });
in
  pkgs.stdenv.mkDerivation {
    inherit version;
    name = "express-blog-${archName}";
    nativeBuildInputs = [nfpm];
    phases = ["installPhase"];
    installPhase = ''
      mkdir -p $out
      ${nfpm}/bin/nfpm package --config ${nfpmConfig} --packager deb --target $out/express-blog-${version}_${archName}.deb
    '';
  }
