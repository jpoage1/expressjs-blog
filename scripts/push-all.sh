#!/bin/sh
for remote in $(git remote); do
    git push "$remote" --all --force
    git push "$remote" --tags --force
done
