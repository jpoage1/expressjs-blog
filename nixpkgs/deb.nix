{
  pkgs,
  archName,
  expressjs-blog,
  nfpm ? pkgs.nfpm,
  ...
}: let
  inherit (expressjs-blog) version;

  # Built with `path + "string"` rather than bare path literals throughout:
  # the systemd template unit's filename contains `@`, which isn't valid
  # inside a bare Nix path token.
  selfDir = ./.;
  repoRoot = ../.;

  # Named without the `@` on disk -- Nix store path names can't contain
  # it (string-interpolating a local path copies it into the store under
  # its original filename). nfpm's `dst` below still installs it as the
  # systemd-required express-blog@.service.
  unitFile = selfDir + "/express-blog.service";
  postinstFile = selfDir + "/express-blog.postinst";
  nginxExampleFile = repoRoot + "/nginx/jasonpoage.com.conf.example";

  configContents =
    map (env: {
      src = "${repoRoot + "/config/${env}.toml.example"}";
      dst = "/etc/express-blog/${env}.toml";
      type = "config|noreplace";
    }) ["release" "testing"];

  nfpmConfig = pkgs.writeText "nfpm-${archName}.yaml" (builtins.toJSON {
    name = "expressjs-blog";
    arch = archName;
    platform = "linux";
    inherit version;
    maintainer = "Jason Poage <jason@jasonpoage.com>";
    description = "jasonpoage.com blog application (${archName})";

    # Pure Node/Express now -- no Python component, unlike the previous
    # generation of this package which vestigially depended on
    # python3-fastapi/uvicorn/pydantic/sqlalchemy/requests from an earlier
    # architecture.
    depends = ["nodejs (>= 20)"];

    scripts = {
      postinstall = "${postinstFile}";
    };

    contents =
      [
        {
          src = "${expressjs-blog}/lib";
          dst = "/usr/lib";
          type = "tree";
        }
        {
          src = "${expressjs-blog}/share";
          dst = "/usr/share";
          type = "tree";
        }
        {
          src = "${unitFile}";
          dst = "/usr/lib/systemd/system/express-blog@.service";
          type = "file";
        }
        {
          src = "${nginxExampleFile}";
          dst = "/usr/share/expressjs-blog/nginx/jasonpoage.com.conf.example";
          type = "file";
        }
      ]
      ++ configContents;
  });
in
  pkgs.stdenv.mkDerivation {
    inherit version;
    name = "expressjs-blog-${archName}";
    nativeBuildInputs = [nfpm];
    phases = ["installPhase"];
    installPhase = ''
      mkdir -p $out
      ${nfpm}/bin/nfpm package --config ${nfpmConfig} --packager deb --target $out/expressjs-blog-${version}_${archName}.deb
    '';
  }
