{
  lib,
  python3Packages,
  fetchgit,
  nodejs_latest,
  nodePackages,
  chromium,
  imagemagick,
  makeWrapper,
  which,
}: let
  deployment_pipeline = python3Packages.buildPythonPackage {
    pname = "deployment_pipeline";
    version = "0.1.0";
    pyproject = true;
    src = fetchgit {
      url = "ssh://git@git.jasonpoage.vpn:29418/jason/deployment_pipeline.git";
      rev = "main";
      hash = "sha256-2yapZOSOop/ng8MNjZcuJIr7Qu9rZfeHlH8h0ljN4aE=";
    };
    # src = fetchFromGitHub {
    #   owner = "jpoage1";
    #   repo = "deployment_pipeline";
    #   rev = "main";
    #   hash = "sha256-2yapZOSOop/ng8MNjZcuJIr7Qu9rZfeHlH8h0ljN4aE=";
    # };
    nativeBuildInputs = with python3Packages; [
      setuptools
      wheel
    ];
    doCheck = false;
  };
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
        nodePackages.pnpm
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

    # Inject environment variables into the final binary
    postFixup = ''
      wrapProgram $out/bin/deployment_pipeline \
        --set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true \
        --set PUPPETEER_EXECUTABLE_PATH ${chromium}/bin/chromium
    '';

    meta = with lib; {
      description = "Deployment Pipeline with Node.js and Chromium integration";
      license = licenses.mit;
      maintainers = ["Jason Poage"];
    };
  }
