{
  lib,
  stdenv,
  python3,
  pkg-config,
  expressjs-blog,
  node-gyp,
  libGL,
  libX11,
  libuuid,
  esbuild,
  src ? ../.,
  ...
}: let
  inherit (expressjs-blog) nodePackages version;
  inherit (nodePackages) yarn-berry;
  cleanedSource = lib.cleanSourceWith {
    inherit src;
    filter = name: type: let
      relPath = lib.removePrefix (toString src) (toString name);
      base = baseNameOf name;

      isYarnInternals =
        lib.hasPrefix "/.yarn/cache" relPath
        || lib.hasPrefix "/.yarn/releases" relPath
        || lib.hasPrefix "/node_modules" relPath
        || lib.hasPrefix "/.yarn/install-state.gz" relPath
        || lib.hasPrefix "/.yarn/plugins" relPath;

      # 2. Logic for root-level files
      isCoreMetadata =
        base
        == "package.json"
        || base == "yarn.lock"
        || base == ".yarnrc.yml"
        || relPath == "/.yarn";

      keep = isYarnInternals || isCoreMetadata;
    in
      # keep;
      # Only trace if it's NOT a cache file to keep the log readable
      if isYarnInternals
      then true
      else
        builtins.trace "Filter: ${relPath} -> ${
          if keep
          then "KEEP-offline-cache"
          else "SKIP-offline-cache"
        }"
        keep;
  };
in
  stdenv.mkDerivation {
    name = "expressjs-blog.yarn-cache";
    src = cleanedSource;

    nativeBuildInputs =
      lib.attrValues nodePackages
      ++ [
        python3
        pkg-config
        node-gyp
        esbuild
      ];

    buildInputs = [
      libuuid
      libGL
      libX11
    ];

    outputHashMode = "recursive";
    outputHash = "sha256-ZYf4HvRvsxGHHZsMtn8Y6wvuwAHy28kv5JRwQWLlpJg=";

    buildPhase = ''
      HOME=$TMPDIR
      export YARN_ENABLE_SCRIPTS=0
      ${yarn-berry}/bin/yarn version ${version}
      ${yarn-berry}/bin/yarn config set cacheFolder .yarn/cache
      ${yarn-berry}/bin/yarn config set enableScripts false
      ${yarn-berry}/bin/yarn install --immutable --immutable-cache --mode=skip-build
    '';

    installPhase = ''
      mkdir -p $out
      cp -rv .yarn/cache/* $out/
      cp yarn.lock $out/
    '';
  }
