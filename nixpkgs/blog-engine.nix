{
  lib,
  pkgs,
  fetchgit,
  fetchFromGitHub,
  nodejs_24,
  stdenv,
  python3,
  pkg-config,
  yarn-berry,
  expressjs-blog,
  src ? ../.,
  ...
}: let
  local_source = ./.;
  vpn_source = builtins.fetchGit {
    url = "ssh://git@git.jasonpoage.vpn:29418/jason/expressjs-blog.git";
  };
  github_source = fetchFromGitHub {
    owner = "jpoage1";
    repo = "expressjs-blog";
    rev = "main";
    hash = "sha256-vV2VNLIwPZRZrBFQH3IC0H8JsLGYDPoMEPIAeOsZwJc=";
  };
  deployment_pipeline = pkgs.callPackage local_source {};
  filteredSource = lib.cleanSourceWith {
    name = "expressjs-blog.blog-engine-source";
    inherit src;
    filter = name: type: let
      relPath = lib.removePrefix (toString src) (toString name);
      _ =
        builtins.trace "Filter: ${relPath} -> ${
          if includePath
          then "KEEP-cleaned-source"
          else "SKIP-cleaned-source"
        }"
        null;
      includePath =
        lib.any (
          target:
            (relPath == target)
            || (lib.hasPrefix (target + "/") relPath)
            || (lib.hasPrefix relPath target)
        ) [
          "/css"
          "/src"
          "/tests"
          "/vite.config.js"
          "/tsconfig.json"
          "/svelte.config.js"
          "/vitest.shims.d.ts"
          "/vitest.config.ts"
          "/tsconfig.json"
          "/svelte.config.js"
          "/static"
          "/index.html"
          "/scripts"
          "/public"

          # Packaging
          "/package.json"
          "/node_modules"
          "/.yarn"
          "/.yarnrc.yml"
          "/yarn.lock"
          "/package.json"
          "/.yarn/install-state.gz"
        ];
    in
      includePath;
  };
in
  stdenv.mkDerivation rec {
    pname = "expressjs-blog";
    version = "1.0.0";

    src = filteredSource;

    nativeBuildInputs = [
      python3
      pkg-config
      nodejs_24
      yarn-berry
    ];

    buildInputs = [
      pkgs.vips # Required for 'sharp' native build
    ];

    preBuild = ''
      export HOME=$(mktemp -d)
      export YARN_CACHE_FOLDER=${expressjs-blog.yarnCache}

      echo "Setting custom cache folder to ${expressjs-blog.yarnCache}"

      export PUPPETEER_SKIP_DOWNLOAD=1
      export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1

      yarn config set enableGlobalCache false
      yarn config set cacheFolder ${expressjs-blog.yarnCache}
      yarn install --immutable --immutable-cache
    '';

    buildPhase = ''
      runHook preBuild
      yarn combine:css
      runHook postBuild
    '';

    doCheck = true;

    checkPhase = ''
      runHook preCheck
      yarn test:postreceive
      runHook postCheck
    '';

    installPhase = ''
      mkdir -p $out/share/expressjs-blog
      cp -r . $out/share/expressjs-blog
    '';

    meta = with lib; {
      description = "Express Blog Artifact";
      platforms = platforms.linux;
    };
  }
