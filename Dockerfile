# Jerry-rigged build for the @jpoage1/* portal: dependencies.
#
# package.json depends on @jpoage1/* via
# `portal:/srv/projects/node_packages/@jpoage1/*`, and node_modules/@jpoage1/*
# are *relative* symlinks pointing four directories up into
# /srv/projects/node_packages/@jpoage1/*. To make those symlinks resolve
# inside the image, build with the PARENT of this repo (/srv/projects) as the
# build context and this file as the dockerfile, e.g.:
#
#   docker build -f jasonpoage.com/expressjs-blog/Dockerfile \
#     -t jpoage1/expressjs-blog:latest /srv/projects
#
# TODO: once @jpoage1/* packages are published to a real registry, drop the
# portal: deps and this whole jerry-rig in favor of a normal yarn install.

FROM node:24-bookworm-slim

WORKDIR /srv/projects/jasonpoage.com/expressjs-blog

# Sibling @jpoage1/* packages — must land at this same absolute path for the
# relative portal symlinks in node_modules to resolve.
COPY node_packages /srv/projects/node_packages

COPY jasonpoage.com/expressjs-blog/package.json jasonpoage.com/expressjs-blog/yarn.lock ./
COPY jasonpoage.com/expressjs-blog/node_modules ./node_modules
COPY jasonpoage.com/expressjs-blog/src ./src
COPY jasonpoage.com/expressjs-blog/content ./content
COPY jasonpoage.com/expressjs-blog/config.prod.toml ./

ENV NODE_ENV=production
ENV CONFIG_PATH=./config.prod.toml

EXPOSE 3400
CMD ["node", "src/app.js"]
