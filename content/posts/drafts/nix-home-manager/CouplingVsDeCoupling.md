# Coupling vs Decoupling

File structure of Nix-Config is lightly different from home-manager, because of the way the modules have to be imported.

BTRFS is an optimal way I have found to organized nix-config into subvolumes.

This can seem overwhelming at first. Don't obsess over the file stucture. It's best to have everything working first in one large file. Refactor as you go and start to get a feel for what should be a modules and what shouldn't be.

You may not want to follow the same file hierarchy as me, everyone has different requirements.

It's important to maintain a seperation of concerns. Configure everything with home manager. Retain the mind set that everything belongs in home-manager. It can be easy to get overwhelmed with what should go where, unless you are already very experienced and knowledgable with Linux. If you cannot make a nix-expression work for you in home-manager, that is a good time to explore adding it as part of the global nix-config.

## NixOS

- .git-crypt/
- files/
- hosts/
- @modules/ (global space)
- @overlays/ (global space)
- secrets/
- users/
    - home-manager/
        - @modules/ (global space)
            - systemd/
        - @overlays/ (global space)
        - @flakes/ (global space)
        - systemd/ (user space)
            - modules/
    - nixpkgs/
    - flakes/
- .gitattributes
- .gitignore
- boot.nix
- configuration.nix
- hardware-configuration.nix
- environment.nix
- networking.nix
- packages.nix
- programs.nix
- security.nix
- services.nix
- systemd.nix
- usres.nix
- version.nix

## Home Manager

- @flakes/ (global space)
- @modules/ (global space)
- nixpkgs/ (user space)
- overlays/ (user space)
- systemd/ (user space)
    - modules/ (user space)
- dotfiles.nix
- home-manager.nix
- home.nix
- packages.nix
- programs.nx
- sessionVariables.nix
- version.nix
