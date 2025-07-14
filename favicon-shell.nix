{ pkgs ? import <nixpkgs> {} }:

pkgs.buildFHSEnv {
  name = "puppeteer-env";
  targetPkgs = pkgs: with pkgs; [
    nodejs_latest
    nodePackages.pnpm
    nodePackages.pm2
    
    # Core libraries that Chrome needs
    expat
    nss
    nspr
    alsa-lib
    atk
    cups
    dbus
    glib
    gtk3
    pango
    cairo
    libxkbcommon
    
    # X11 libraries
    xorg.libX11
    xorg.libXcomposite
    xorg.libXdamage
    xorg.libXrandr
    xorg.libxshmfence
    xorg.libXext
    xorg.libXfixes
    xorg.libXrender
    xorg.libXtst
    xorg.libXScrnSaver
    
    # Graphics and system libraries
    mesa
    udev
    libdrm
    systemd
    
    # Additional libraries Chrome might need
    fontconfig
    freetype
    zlib
    libpng
    libjpeg
    
    # Utilities
    which
    chromium  # This ensures all Chrome dependencies are available
  ];

  runScript = "bash";

  extraBuildCommands = ''
    export NODE_ENV=development
    export LD_LIBRARY_PATH=${pkgs.lib.makeLibraryPath (with pkgs; [
      expat
      nss
      nspr
      alsa-lib
      atk
      cups
      dbus
      glib
      gtk3
      pango
      cairo
      libxkbcommon
      xorg.libX11
      xorg.libXcomposite
      xorg.libXdamage
      xorg.libXrandr
      xorg.libxshmfence
      xorg.libXext
      xorg.libXfixes
      xorg.libXrender
      xorg.libXtst
      xorg.libXScrnSaver
      mesa
      udev
      libdrm
      systemd
      fontconfig
      freetype
      zlib
      libpng
      libjpeg
    ])}:$LD_LIBRARY_PATH
  '';
}
