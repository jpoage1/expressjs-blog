{
  pkgs ? import <nixpkgs> {
    config.allowUnfree = true;
  },
}: let
  # NOTE: `src` must always be passed explicitly to callPackage here.
  # nixpkgs has a top-level `src` alias (throws "renamed to
  # simple-revision-control") -- callPackage's auto-arg injection matches
  # package.nix's `src` parameter name against that poisoned attribute
  # and supplies it instead of package.nix's own `src ? ./.` default,
  # unless we override it ourselves.
  callBlog = targetPkgs: targetPkgs.callPackage ./package.nix {src = ./.;};

  expressjs-blog = callBlog pkgs;

  # Cross-build the arm64 .deb the same way the old package.nix did: import
  # nixpkgs for aarch64-linux and build the app derivation against it, so
  # native deps (if any ever creep back in) resolve for the Pi's arch.
  armPkgs = import pkgs.path {
    system = "aarch64-linux";
    config.allowUnfree = true;
  };

  mkDeb = archName: targetPkgs:
    targetPkgs.callPackage ./nixpkgs/deb.nix {
      inherit archName;
      expressjs-blog = callBlog targetPkgs;
    };

  # docker/podman only run linux containers on a linux host anyway, so the
  # e2e image is always built for the dev box's own arch (pkgs, not
  # armPkgs) -- it's a network test client, not something deployed to the
  # Pi.
  e2eTestImage = pkgs.callPackage ./nixpkgs/e2e-image.nix {
    expressjs-blog = callBlog pkgs;
  };
in {
  inherit expressjs-blog e2eTestImage;
  deb-amd64 = mkDeb "amd64" pkgs;
  deb-arm64 = mkDeb "arm64" armPkgs;
}
