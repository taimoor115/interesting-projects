#!/bin/bash
set -e  # Exit immediately if any command fails
echo "Launching node script.js"

if [ -z "$GITHUB_REPOSITORY_URL" ]; then
  echo "Error: GITHUB_REPOSITORY_URL is not set."
  exit 1
fi

export GIT_REPOSITORY_URL="$GITHUB_REPOSITORY_URL"
git clone "$GIT_REPOSITORY_URL" /home/app/output || {
  echo "Error: Failed to clone repository."
  exit 1
}
exec node script.js