# NodeJS PM2
# shell.nix
{pkgs ? import <nixpkgs> {}}: let
  # deployment_pipeline = python3Packages.buildPythonPackage {
  #   pname = "deployment_pipeline";
  #   version = "0.1.0";
  #   pyproject = true;
  #   src = fetchgit {
  #     url = "ssh://git@git.jasonpoage.vpn:29418/jason/pipeline_runner.git";
  #     rev = "main";
  #     hash = "sha256-2yapZOSOop/ng8MNjZcuJIr7Qu9rZfeHlH8h0ljN4aE=";
  #   };
  #   # src = fetchFromGitHub {
  #   #   owner = "jpoage1";
  #   #   repo = "deployment_pipeline";
  #   #   rev = "main";
  #   #   hash = "sha256-2yapZOSOop/ng8MNjZcuJIr7Qu9rZfeHlH8h0ljN4aE=";
  #   # };
  #   nativeBuildInputs = with python3Packages; [
  #     setuptools
  #     wheel
  #   ];
  #   doCheck = false;
  # };
  deployment_pipeline = pkgs.callPackage ./package.nix {};
in
  pkgs.mkShell {
    inputsFrom = [deployment_pipeline];
    # packages = with pkgs;
    #   [
    #     which
    #     nodejs_latest
    #     nodePackages.pnpm
    #     chromium
    #     # nodePackages.pm2mk
    #     imagemagick
    #     deployment_pipeline
    #   ]
    #   ++ (with python313Packages; [tomli lupa pip]);
    shellHook = ''
      export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
      export PUPPETEER_EXECUTABLE_PATH=${pkgs.chromium}/bin/chromium
      alias mkicon="node src/render-favicon.js"
      alias mkfavicons="node src/generate-favicon.js"
      alias mkfavicon="magick static/favicons/favicon-512.png -define icon:auto-resize=64,48,32,16 static/favicons/favicon.ico"
      echo "Type 'mkicon' to render the favicon-512.png"
      echo "Type 'mkfavicon' to generate favicon.ico from favicon-512.png"

    '';
  }
