# shell.nix
{pkgs ? import <nixpkgs> {}}: let
  express-blog = pkgs.callPackage ./package.nix {};
in
  pkgs.mkShell {
    inputsFrom = [express-blog];
    shellHook = ''
      export PYTHONPATH="$PYTHONPATH:$(pwd)/src"
      export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
      export PUPPETEER_EXECUTABLE_PATH=${pkgs.chromium}/bin/chromium

      alias mkicon="node src/render-favicon.js"
      alias mkfavicons="node src/generate-favicon.js"
      alias mkfavicon="magick static/favicons/favicon-512.png -define icon:auto-resize=64,48,32,16 static/favicons/favicon.ico"

      echo
      echo "Type 'mkicon' to render the favicon-512.png"
      echo "Type 'mkfavicon' to generate favicon.ico from favicon-512.png"

    '';
  }
