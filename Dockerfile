# ---- Build Stage ----
FROM node:22-bookworm AS builder

ARG GIT_REPO
ARG GIT_COMMIT

WORKDIR /app

RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libvips-dev \
    git \
    && rm -rf /var/lib/apt/lists/*

# Clone specific commit/branch
RUN git clone --depth 1 --branch "$GIT_COMMIT" "$GIT_REPO" . \
    || (git clone "$GIT_REPO" . && git checkout "$GIT_COMMIT")

RUN corepack enable && corepack prepare yarn@4.9.2 --activate

# Install dependencies and build assets
RUN yarn install
RUN yarn combine:css

# ---- Runtime Stage ----
FROM node:22-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

# Install runtime library for sharp (vips)
RUN apt-get update && apt-get install -y \
    libvips \
    && rm -rf /var/lib/apt/lists/*

# Copy only necessary files from builder
COPY --from=builder /app/package.json /app/yarn.lock ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/src ./src

RUN corepack enable && corepack prepare yarn@4.9.2 --activate

EXPOSE 3000
CMD ["yarn", "prod"]
