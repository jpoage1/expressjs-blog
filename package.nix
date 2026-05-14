{
  lib,
  pkgs,
  fetchgit,
  fetchFromGitHub,
  nodejs_latest,
  chromium,
  imagemagick,
  makeWrapper,
  which,
  python3Packages,
}: let
  local_source = ../../deployment_pipeline;
  vpn_source = builtins.fetchGit {
    url = "ssh://git@git.jasonpoage.vpn:29418/jason/deployment_pipeline.git";
  };
  github_source = fetchFromGitHub {
    owner = "jpoage1";
    repo = "deployment_pipeline";
    rev = "main";
    hash = "sha256-WHDDL1ej8au4pKCQTBVWs4VXKVNx/wIOS9HMSaoyOFI=";
  };
  deployment_pipeline = pkgs.callPackage local_source {};
in
  python3Packages.buildPythonApplication {
    pname = "deployment_pipeline";
    version = "0.1.0";
    pyproject = true;

    src = ./.;

    nativeBuildInputs = [makeWrapper];

    # Combine Python and System dependencies
    propagatedBuildInputs =
      [
        deployment_pipeline
        nodejs_latest
        # pnpm
        chromium
        imagemagick
        which
      ]
      ++ (with python3Packages; [
        tomli
        lupa
        pip
        setuptools
      ]);

    # # Inject environment variables into the final binary
    # postFixup = ''
    #   wrapProgram $out/bin/deployment_pipeline \
    #     --set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true \
    #     --set PUPPETEER_EXECUTABLE_PATH ${chromium}/bin/chromium
    # '';

    meta = with lib; {
      description = "Deployment Pipeline with Node.js and Chromium integration";
      license = licenses.mit;
      maintainers = ["Jason Poage"];
    };
  }
