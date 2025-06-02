# NodeJS PM2
# shell.nix

{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  packages = [
    pkgs.which
    pkgs.nodejs_latest
    pkgs.nodePackages.pnpm 
   # pkgs.nodePackages.pm2
  ];

  shellHook = ''
    export NODE_ENV=development
  '';
}

