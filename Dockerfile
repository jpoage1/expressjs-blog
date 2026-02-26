# Dockerfile

# Docker image
FROM node:22-bookworm

ARG GIT_REPO
ARG GIT_COMMIT
ARG NODE_ENV

# Set working directory
WORKDIR /app

# Install system dependencies for native modules
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libvips-dev \
    sqlite3 \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN git clone --depth 1 --branch "$GIT_COMMIT" "$GIT_REPO" . \
    || (git clone "$GIT_REPO" . && git checkout "$GIT_COMMIT")

# Fails if the lockfile is out of sync with package.json.
RUN npm ci

# Build step if needed (adjust as appropriate)
RUN npm run combine:css

# Set environment variables
ENV NODE_ENV="$NODE_ENV"

# Start the app
CMD ["npm", "run", "prod"]
