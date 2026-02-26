#!/bin/bash
export $(grep -v '^#' .env | grep -E '^(NODE_ENV)' | xargs)
GIT_REPO="ssh://git.jasonpoage.vpn:29418/jason/express-blog.git"
GIT_COMMIT=$(git rev-parse origin/dev)

docker build --build-arg GIT_REPO="$GIT_REPO" --build-arg GIT_COMMIT="$GIT_COMMIT" --build-arg NODE_ENV="$NODE_ENV" -t express-blog .
