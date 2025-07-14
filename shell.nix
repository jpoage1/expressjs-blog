# NodeJS PM2
# shell.nix

{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  packages = with pkgs; [
    which
    nodejs_latest
    nodePackages.pnpm
    chromium 
   # nodePackages.pm2mk
   imagemagick
  ];

  shellHook = ''
    export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
    export PUPPETEER_EXECUTABLE_PATH=${pkgs.chromium}/bin/chromium
    alias mkicon="node src/render-favicon.js"
    alias mkfavicons="node src/generate-favicon.js"
    alias mkfavicon="magick static/favicons/favicon-512.png -define icon:auto-resize=64,48,32,16 static/favicons/favicon.ico"
    echo "Type 'mkicon' to render the favicon-512.png"
    echo "Type 'mkfavicon' to generate favicon.ico from favicon-512.png"

  '';
}
