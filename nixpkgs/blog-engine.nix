{
  lib,
  pkgs,
  fetchgit,
  fetchFromGitHub,
  nodejs_24,
  stdenv,
  yarn-berry,
  express-blog,
  src ? ../.,
  ...
}: let
  local_source = ./.;
  vpn_source = builtins.fetchGit {
    url = "ssh://git@git.jasonpoage.vpn:29418/jason/express-blog.git";
  };
  github_source = fetchFromGitHub {
    owner = "jpoage1";
    repo = "expressjs-blog";
    rev = "main";
    hash = "sha256-vV2VNLIwPZRZrBFQH3IC0H8JsLGYDPoMEPIAeOsZwJc=";
  };
  deployment_pipeline = pkgs.callPackage local_source {};
  filteredSource = lib.cleanSourceWith {
    name = "express-blog.blog-engine-source";
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
          "/.yarnrc"
          "/yarn.lock"
          "/package.json"
          "/.yarn/install-state.gz"
        ];
    in
      includePath;
  };
in
  stdenv.mkDerivation rec {
    pname = "express-blog";
    version = "1.0.0";

    src = filteredSource;

    nativeBuildInputs = [
      nodejs_24
      yarn-berry
    ];

    preBuild = ''
      export HOME=$(mktemp -d)
      yarn config set cacheFolder ${express-blog.yarnCache}
      yarn install --immutable --immutable-cache
    '';

    buildPhase = ''
      yarn combine:css
    '';

    doCheck = true;

    checkPhase = ''
      yarn test:postreceive
    '';

    installPhase = ''
      mkdir -p $out/share/express-blog
      cp -r . $out/share/express-blog
    '';

    meta = with lib; {
      description = "Express Blog Artifact";
      platforms = platforms.linux;
    };
  }
