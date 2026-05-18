# overlays/hexascript-deps.nix
self: super: {
  hexascriptPythonDeps = with super.python3Packages; [
    black
    pytest
    fastapi
    uvicorn
    requests
    httpx
    sqlalchemy
    transformers
    pandas
    pydantic
    pydantic-settings
    websockets
    # Add all other python libs from api-server.nix here
  ];

  hexascriptNodeDeps = with super; [
    nodejs_24
    yarn-berry
    corepack
    mermaid-cli
  ];
}
