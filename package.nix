{
  pkgs ? import <nixpkgs> {},
  lib ? pkgs.lib,
  stdenv ? pkgs.stdenv,
  nodejs ? pkgs.nodejs_24,
  corepack ? pkgs.corepack,
  yarn-berry ? pkgs.yarn-berry,
  src ? ./.,
  # Same technique as /srv/projects/finance.lan/svelte/package.nix: pin a rev
  # of the node_packages monorepo instead of building against whatever's
  # live (and possibly dirty) in /srv/projects/node_packages. Bump the rev
  # here when @jpoage1/* packages need to move forward.
  nodePackagesSrc ? (builtins.fetchGit {
    # LAN alternative, if the production gitea host isn't reachable:
    # url = "ssh://git@git-lan.jasonpoage.com:30222/packages/node.git";
    url = "ssh://gitea@git.jasonpoage.com:2222/packages/node.git";
    ref = "main";
    rev = "b868cffc997cf67f575dc1b354b41e8861ebbb51";
  }),
}: let
  appName = "expressjs-blog";
  inherit (builtins.fromJSON (builtins.readFile ./version.json)) version;

  yarnBin = "${yarn-berry}/bin/yarn";

  rawSrc = src;

  # Unlike finance-svelte, there's no build step here (no bundler) -- this
  # is a plain Express server. We only need enough to run `yarn install`
  # and ship src/ + node_modules/ + content/ at runtime.
  cleanedSource = lib.cleanSourceWith {
    name = "${appName}-source";
    src = rawSrc;
    filter = name: type: let
      relPath = lib.removePrefix (toString rawSrc) (toString name);
      includePath =
        lib.any (
          target:
            (relPath == target)
            || (lib.hasPrefix (target + "/") relPath)
            || (lib.hasPrefix relPath target)
        ) [
          "/src"
          "/content"
          "/test"
          "/package.json"
          "/yarn.lock"
          "/.yarnrc.yml"
          "/eslint.config.js"
          "/version.json"
          "/config.example.toml"
        ];
    in
      includePath;
  };
in
  # A single fixed-output derivation, not the usual FOD-cache +
  # network-free-install split (which is what finance-svelte/package.nix
  # does). That split exists there to let multiple consumer derivations
  # (the app build, a separate test-suite target) share one fetched yarn
  # cache. There's no second consumer here, and splitting it added a real
  # problem: nixpkgs' yarn-berry is newer than this repo's pinned
  # packageManager (yarn@4.9.2), so loading the v8 yarn.lock triggers a
  # v8->v9 metadata migration -- fine to let happen once, but Yarn's
  # "Resolution step" wants registry access to validate it even when
  # everything's already cached, which the network-free second derivation
  # can't provide. Doing the whole build inside one FOD sidesteps that:
  # network stays available throughout, and reproducibility still comes
  # from the pinned node_packages rev + this repo's own yarn.lock, exactly
  # like offlineCache would have given us.
  stdenv.mkDerivation {
    pname = "${appName}-app";
    inherit version;
    src = cleanedSource;

    nativeBuildInputs = [nodejs yarn-berry corepack];

    outputHashMode = "recursive";
    # Per-arch: the fetched set of platform-specific optional deps differs
    # by target CPU, so one hash can't cover both x86_64 and aarch64.
    # Placeholders below are filled in by actually running the build:
    # the first `nix-build` attempt fails and prints the real hash to
    # substitute in (standard Nix FOD workflow).
    # Same hash for both arches: no native/platform-specific optional
    # deps exist in this dependency tree (no sharp, puppeteer, etc.), so
    # the resulting file content is byte-identical regardless of target
    # CPU -- confirmed by actually building both and comparing.
    #
    # NOTE: this hash pins exact file content. It does NOT get
    # invalidated just because src/ changed underneath it -- if a store
    # path already exists matching this hash, Nix reuses it outright
    # without rebuilding. Bump to lib.fakeHash and rebuild to get the new
    # real hash any time src/content/package.json changes.
    outputHash = "sha256-8wC0wH4KhEaOt5qUfj21JM8deux/eiOaMCcW8ht7eHk=";

    # Pure JS app, nothing to strip -- the default fixup hook invokes
    # `strip` on every file it walks (not just ELF binaries), which under
    # QEMU emulation for the arm64 build turned into thousands of
    # emulated `strip` subprocess spawns across node_modules and made the
    # build pathologically slow. Nothing here needs it anyway.
    dontStrip = true;
    dontPatchShebangs = true;

    buildPhase = ''
      HOME=$(mktemp -d)
      export NODE_TLS_REJECT_UNAUTHORIZED=0
      export YARN_ENABLE_GLOBAL_CACHE=false
      export YARN_ENABLE_SCRIPTS=0
      ${yarnBin} config set enableStrictSsl false
      ${yarnBin} config set enableScripts false
      ${yarnBin} config set supportedArchitectures.cpu --json '["${
        if stdenv.hostPlatform.isAarch64
        then "arm64"
        else "x64"
      }"]'
      ${yarnBin} config set supportedArchitectures.os --json '["linux"]'

      # Keep a pristine copy before rewriting -- the rewritten package.json
      # (below) points portal: deps at a Nix store path, which must never
      # end up inside $out (this is a fixed-output derivation: Nix forbids
      # store-path references in FOD output, and even if it didn't, a
      # store path is meaningless on the Pi, which has no Nix store).
      # Node doesn't consult package.json's dependencies/resolutions for
      # module resolution at runtime anyway -- only node_modules' actual
      # contents matter -- so shipping the original is strictly better.
      cp package.json package.json.orig

      # Rewrite portal: references to the pinned, fetched copy instead of
      # the live dev tree at /srv/projects/node_packages.
      sed -i 's|/srv/projects/node_packages|${nodePackagesSrc}|g' package.json yarn.lock

      # No --immutable: see comment above re: the v8 -> v9 lockfile
      # migration. This rewritten/migrated lockfile never gets committed
      # back to the repo.
      ${yarnBin} install
    '';

    doCheck = true;
    checkPhase = ''
      runHook preCheck

      cp config.example.toml config.dev.toml
      sed -i \
        -e 's|root_dir     = "/srv/projects/expressjs-blog"|root_dir     = "."|' \
        -e 's|content_path = "/srv/projects/expressjs-blog/content"|content_path = "./content"|' \
        -e 's|address   = "0.0.0.0"|address   = "127.0.0.1"|' \
        -e 's|log_dir   = "/var/log/expressjs-blog"|log_dir   = "./logs"|' \
        -e 's|log_path        = "/var/lib/expressjs-blog/data/emails.json"|log_path        = "./data/emails.json"|' \
        config.dev.toml
      mkdir -p logs data
      export NODE_OPTIONS=--preserve-symlinks

      ${yarnBin} lint
      ${yarnBin} test

      runHook postCheck
    '';

    installPhase = ''
      mkdir -p $out/lib/expressjs-blog
      cp -r src content $out/lib/expressjs-blog/
      cp package.json.orig $out/lib/expressjs-blog/package.json

      # node_modules/@jpoage1/* are portal: symlinks pointing into the Nix
      # store (${nodePackagesSrc}). finance-svelte never ships node_modules
      # at runtime -- its installPhase only copies the Vite build output,
      # so the symlinks never leave the build sandbox. This is a live
      # Node server: node_modules must be require()-able on the Pi, which
      # has no Nix store to resolve those symlinks against. Dereference
      # them into real files so the package is self-contained.
      cp -rL node_modules $out/lib/expressjs-blog/node_modules

      # Yarn's own bookkeeping file for the node-modules linker -- records
      # the resolution plan, including the rewritten store-path portal:
      # targets. Not needed at runtime (Node just reads node_modules'
      # actual contents) and must not leak a store path into $out.
      rm -f $out/lib/expressjs-blog/node_modules/.yarn-state.yml

      mkdir -p $out/share/expressjs-blog
      cp config.example.toml $out/share/expressjs-blog/config.example.toml
    '';

    doInstallCheck = true;
    installCheckPhase = ''
      echo "Verifying build output in $out/lib/expressjs-blog..."

      if [ ! -f "$out/lib/expressjs-blog/src/app.js" ]; then
        echo "ERROR: src/app.js is missing from the build output!"
        exit 1
      fi

      if [ -L "$out/lib/expressjs-blog/node_modules/@jpoage1/config" ]; then
        echo "ERROR: @jpoage1/config is still a symlink after dereferencing -- it won't resolve on a target without Nix!"
        exit 1
      fi

      echo "Build verification passed successfully!"
    '';

    meta = with lib; {
      description = "jasonpoage.com blog application";
      platforms = platforms.linux;
    };
  }
