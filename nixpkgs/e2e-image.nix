{
  pkgs,
  expressjs-blog,
  ...
}: let
  nodejs = pkgs.nodejs_24;

  # expressjs-blog (../package.nix) already has fully-installed,
  # dereferenced node_modules + src + content -- reuse it directly rather
  # than re-running yarn install (matching finance.lan/tests/package.nix's
  # own "reuse the app package's build output" convention), just layer the
  # e2e test file + a config on top for local route discovery.
  e2eSuite = pkgs.stdenv.mkDerivation {
    name = "expressjs-blog-e2e-suite";
    dontUnpack = true;
    installPhase = ''
      mkdir -p $out
      cp -r ${expressjs-blog}/lib/expressjs-blog/. $out/
      mkdir -p $out/test/e2e
      cp ${../test/e2e/e2e.test.js} $out/test/e2e/e2e.test.js
      cp ${../config.dev.toml} $out/config.dev.toml
    '';
  };
in
  pkgs.dockerTools.buildImage {
    name = "expressjs-blog-tests-e2e";
    tag = "latest";
    copyToRoot = pkgs.buildEnv {
      name = "expressjs-blog-tests-e2e-root";
      paths = [nodejs pkgs.cacert];
      pathsToLink = ["/bin" "/etc"];
    };
    config = {
      WorkingDir = "${e2eSuite}";
      # --test-force-exit: the app's own infrastructure (cleanup
      # intervals, etc.) leaves timers/handles open after the discovery
      # instance is closed, which would otherwise keep node:test running
      # forever even after all tests report their results.
      Entrypoint = ["${nodejs}/bin/node" "--test" "--test-force-exit" "test/e2e/e2e.test.js"];
      Env = [
        "SSL_CERT_FILE=${pkgs.cacert}/etc/ssl/certs/ca-bundle.crt"
      ];
    };
  }
