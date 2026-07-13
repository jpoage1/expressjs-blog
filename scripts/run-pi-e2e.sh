#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat >&2 <<'EOF'
usage: scripts/run-pi-e2e.sh [--production] [node --test args...]

Runs the packaged e2e test image against a real running expressjs-blog
instance -- --add-host forces BLOG_HOST to resolve to BLOG_HOST_IP inside
the container, regardless of the dev box's own DNS, so the test always
hits the intended target (the Pi) rather than whatever that hostname
happens to resolve to locally.

Defaults to the testing instance (test.jasonpoage.com, port 3501 behind
nginx). Pass --production to target the live release instance instead.

Override knobs:
  BLOG_HOST        default: test.jasonpoage.com (jasonpoage.com with --production)
  BLOG_HOST_IP      default: 192.168.1.200
  E2E_IMAGE         default: expressjs-blog-tests-e2e:latest
  BASE_URL          default: https://$BLOG_HOST
  E2E_IGNORE_TLS    default: 1
EOF
}

PRODUCTION=0
case "${1:-}" in
  -h | --help)
    usage
    exit 0
    ;;
  --production)
    PRODUCTION=1
    shift
    ;;
esac

if [[ "$PRODUCTION" == "1" ]]; then
  BLOG_HOST="${BLOG_HOST:-jasonpoage.com}"
else
  BLOG_HOST="${BLOG_HOST:-test.jasonpoage.com}"
fi
BLOG_HOST_IP="${BLOG_HOST_IP:-192.168.1.200}"
E2E_IMAGE="${E2E_IMAGE:-expressjs-blog-tests-e2e:latest}"
BASE_URL="${BASE_URL:-https://${BLOG_HOST}}"
E2E_IGNORE_TLS="${E2E_IGNORE_TLS:-1}"
test_args=("$@")

if [[ "${#test_args[@]}" -eq 0 ]]; then
  test_args=(test/e2e/e2e.test.js)
fi

if [[ "$PRODUCTION" == "1" ]]; then
  echo "[run-pi-e2e] Targeting PRODUCTION ($BASE_URL) -- this hits the live site." >&2
fi

docker run --rm \
  --add-host "${BLOG_HOST}:${BLOG_HOST_IP}" \
  -e BASE_URL="${BASE_URL}" \
  -e E2E_IGNORE_TLS="${E2E_IGNORE_TLS}" \
  --entrypoint node \
  "${E2E_IMAGE}" --test --test-force-exit "${test_args[@]}"
