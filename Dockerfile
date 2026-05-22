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
# RUN git clone --depth 1 --branch "$GIT_COMMIT" "$GIT_REPO" . \
#     || (git clone "$GIT_REPO" . && git checkout "$GIT_COMMIT")

COPY ./.yarnrc.yml ./package.json ./yarn.lock ./
COPY ./.yarn ./.yarn
COPY ./node_modules ./node_modules
COPY ./.puppeteer /var/cache/puppeteer
COPY ./public ./public
COPY ./scripts ./scripts
COPY ./content ./content
COPY ./src ./src

RUN find . -type f -not -path '*/node_modules/*' -not -path '*/.yarn/*' -print0 | \
    sort -z | xargs -0 sha256sum | sha256sum | cut -d' ' -f1 > /app/BUILD_SHA_FILE

ENV YARN_CACHE_FOLDER=/var/cache/yarn
ENV PUPPETEER_CACHE_DIR=/var/cache/puppeteer

RUN corepack enable && corepack prepare yarn@4.9.2 --activate

RUN --mount=type=cache,target=/root/.yarn/berry/cache,sharing=shared \
    --mount=type=cache,target=/app/.yarn/unplugged,sharing=shared \
    --mount=type=cache,target=/var/cache/puppeteer,sharing=shared \
    yarn combine:css && \
    yarn workspaces focus --production

# ---- Runtime Stage ----
FROM node:24-bookworm-slim

ARG BUILD_SHA
ENV BUILD_SHA=${BUILD_SHA}

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# These have fallback defaults built in, no need to explicitly define them.
# Explicit definition will fail for testing
# ENV LOG_DIR=/var/log/expressjs-blog
# ENV CONFIG_PATH=/app/config.toml
# ENV DB_PATH=/var/log/expressjs-blog
# ENV CONTENT_PATH=/app/content



RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y \
    libvips \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/.yarnrc.yml ./
COPY --from=builder /app/.yarn ./.yarn
COPY --from=builder /app/package.json /app/yarn.lock ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/content ./content
COPY --from=builder /app/src ./src
COPY --from=builder /app/BUILD_SHA_FILE ./BUILD_SHA_FILE

RUN export BUILD_SHA=$(cat ./BUILD_SHA_FILE) && \
    echo "Build SHA: ${BUILD_SHA}"

RUN mkdir -p /var/log/expressjs-blog && \
    chmod 755 /var/log/expressjs-blog

RUN corepack enable && corepack prepare yarn@4.9.2 --activate

EXPOSE 3000
CMD ["yarn", "start"]
