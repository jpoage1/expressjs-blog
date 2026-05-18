
self: super:
  hexascriptMakeDeb = {
    targetSuite,
    archName,
  }: let
    # Ensure we have a version string, checking the suite first
    version = targetSuite.version or "0.8.0";

    # Declarative configuration for nFPM
    nfpmConfig = self.writeText "nfpm-${archName}.yaml" (builtins.toJSON {
      name = "hexascript";
      arch = archName;
      platform = "linux";
      version = version;
      maintainer = "Jason Poage <jason@jasonpoage.com>";
      description = "Complete Hexascript Orchestration Suite (${archName})";

      # FHS Mapping: Nix Store -> Debian Filesystem
      contents = [
        {
          src = "${targetSuite}/bin";
          dst = "/usr/bin";
          type = "tree";
        }
        {
          src = "${targetSuite}/lib";
          dst = "/usr/lib/hexascript";
          type = "tree";
        }
        {
          src = "${targetSuite}/share";
          dst = "/usr/share/hexascript";
          type = "tree";
        }
      ];

      # Optional: Add runtime dependencies if needed
      # depends = [ "libc6" "python3" ];
    });
  in
    self.stdenv.mkDerivation {
      pname = "hexascript-deb-${archName}";
      inherit version;

      nativeBuildInputs = with self; [nfpm dpkg];

      # Standard build lifecycle is unnecessary; we only need the installPhase
      phases = ["installPhase"];

      installPhase = ''
        mkdir -p $out
        echo "[*] Packaging ${archName} .deb via nFPM..."

        ${nfpm}/bin/nfpm package \
          --config ${nfpmConfig} \
          --packager deb \
          --target $out/hexascript_${version}_${archName}.deb
      '';
    };
}
