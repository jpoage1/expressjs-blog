{
  pkgs ?
    import <nixpkgs> {
      config.allowUnfree = true;
    },
  staticPath ? null,
}: let
  _ = builtins.trace "Loading Overlays..." null;

  depsOverlay = let
    _ = builtins.trace "Extending pkgs with dependencies Overlay..." null;
  in
    import ./overlays/dependencies.nix;

  debPkgOverlay = let
    _ = builtins.trace "Extending pkgs with deb-pkgs Overlay..." null;
  in
    import ./overlays/deb-pkg.nix;
  # extendedPkgs = pkgs.extend electronOverlay;
in
  builtins.trace "Calling package..." (
    pkgs.callPackage ./package.nix {inherit staticPath;}
  )
