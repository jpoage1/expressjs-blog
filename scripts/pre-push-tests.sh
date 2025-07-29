#!/bin/sh

set -eu
set -x

COMMIT_HASH="$1"
CHECKSUM_FILE=".last_unit_tested_commit"

if [ -f "$CHECKSUM_FILE" ] && [ "$(cat "$CHECKSUM_FILE")" = "$COMMIT_HASH" ]; then
  echo "✓ Skipping tests, already tested commit: $COMMIT_HASH"
  exit 0
fi

if ! yarn test; then
  echo "Initial test suite failed. Skipping prepush and aborting push."
  exit 1
fi

echo "$COMMIT_HASH" > "$CHECKSUM_FILE"
echo "✓ All tests passed for commit: $COMMIT_HASH"

node src/app.js >/dev/null 2>&1 &
  APP_PID=$!

sleep 2

yarn test:prepush
TEST_RESULT=$?

  # Clean up the app process
  if kill -0 $APP_PID 2>/dev/null; then
    echo "Stopping app (PID: $APP_PID)..."
    kill $APP_PID
    # Give it time to shut down gracefully
    sleep 1
    # Force kill if still running
    if kill -0 $APP_PID 2>/dev/null; then
      kill -9 $APP_PID 2>/dev/null || true
    fi
  fi
  
  # Wait for process to fully terminate
  wait $APP_PID 2>/dev/null || true
  

if [ $TEST_RESULT -ne 0 ]; then
  echo "Tests failed. Push aborted."
  exit 1
fi
