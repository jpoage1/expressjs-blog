# overlays/electron-dev.nix
self: super: let
  devPackages = with super; [
    yarn
    nodejs
    # nodePackages.npm
    electron
  ];
  guiLibsBase = with super; [
    dbus
    glib
    gtk3
    nss
    nspr
    atk
    cups
    pango
    cairo
    libgbm
    libjpeg
    expat
    libxkbcommon
    alsa-lib
  ];
  xorgLibs = with super; [
    libXScrnSaver
    libxcb
    libX11
    libXext
    libXcomposite
    libXdamage
    libXfixes
    libXrandr
  ];
  devLibs = guiLibsBase ++ xorgLibs;

  electronShellEnv = pkgs:
    pkgs.mkShell {
      buildInputs = devPackages ++ devLibs;
      shellHook = ''
        export PATH=$PATH:./node_modules/.bin
        export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath devLibs}:${builtins.getEnv "LD_LIBRARY_PATH"}";
      '';
    };
in {
  electronDevPackages = devPackages;
  electronDevLibs = devLibs;
  electronShell = electronShellEnv super;
}
