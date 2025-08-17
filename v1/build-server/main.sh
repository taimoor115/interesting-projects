#!/bin/bash
echo "Launching node script.js"
export GIT_REPOSITORY_URL="$GITHUB_REPOSITORY_URL"
git clone "$GIT_REPOSITORY_URL" /home/app/output

exec node script.js