{pkgs, ...}: {
  nodePackages = with pkgs; {
    inherit
      nodejs_24
      yarn-berry
      corepack
      ;
  };
}
