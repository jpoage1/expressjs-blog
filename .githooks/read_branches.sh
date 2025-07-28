#!/bin/sh

set -eu

# Only run for specific branches
read_branches() {
  while IFS=' ' read -r _ _ remote_ref _; do
    case "$remote_ref" in
      refs/heads/testing|refs/heads/staging|refs/heads/main|refs/heads/production)
        return 0
        ;;
    esac
  done
  return 1
}
