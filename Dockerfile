# ---- Build Stage ----
FROM node:24-bookworm AS builder

ARG GIT_REPO
ARG GIT_COMMIT

WORKDIR /app

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libvips-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Clone specific commit/branch
RUN git clone --depth 1 --branch "$GIT_COMMIT" "$GIT_REPO" . \
    || (git clone "$GIT_REPO" . && git checkout "$GIT_COMMIT")

ENV YARN_CACHE_FOLDER=/var/cache/yarn
ENV PUPPETEER_CACHE_DIR=/var/cache/puppeteer

RUN corepack enable && corepack prepare yarn@4.9.2 --activate

# Install dependencies and build assets
RUN --mount=type=cache,target=/root/.yarn/berry/cache,sharing=shared \
    --mount=type=cache,target=/app/.yarn/unplugged,sharing=shared \
    --mount=type=cache,target=/var/cache/puppeteer,sharing=shared \
    yarn install  --immutable && \
    yarn combine:css

# ---- Runtime Stage ----
FROM node:24-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV CONFIG_PATH=/etc/app/config.toml


# Install runtime library for sharp (vips)
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y \
    libvips \
    && rm -rf /var/lib/apt/lists/*

# Copy only necessary files from builder
COPY --from=builder /app/.yarnrc.yml ./
COPY --from=builder /app/.yarn ./.yarn
COPY --from=builder /app/package.json /app/yarn.lock ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src

RUN corepack enable && corepack prepare yarn@4.9.2 --activate

EXPOSE 3000
CMD ["yarn", "start"]
