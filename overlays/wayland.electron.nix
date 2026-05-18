self: super: let
  devPackages = with super; [
    yarn
    nodejs_24
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
    # Wayland Specifics
    wayland
    wayland-protocols
    mesa # Required for GL acceleration on Wayland
  ];

  # Renamed from xorgLibs to modern flat namespace
  waylandAndX11Libs = with super; [
    libxscrnsaver
    libxcb
    libx11
    libxext
    libxcomposite
    libxdamage
    libxfixes
    libxrandr
  ];

  devLibs = guiLibsBase ++ waylandAndX11Libs;
in {
  electronDevPackages = devPackages;
  electronDevLibs = devLibs;
  electronShell = super.mkShell {
    buildInputs = devPackages ++ devLibs;
    shellHook = ''
      export PATH=$PATH:./node_modules/.bin
      export LD_LIBRARY_PATH="${super.lib.makeLibraryPath devLibs}:$LD_LIBRARY_PATH"

      # Electron Wayland Environment Variables
      export NIXOS_OZONE_WL=1
      export ELECTRON_OZONE_PLATFORM_HINT=auto
    '';
  };
}
