#!/bin/bash

export GIT_REPOSITORY_URL="$GITHUB_REPOSITORY_URL"
git clone "$GIT_REPOSITORY_URL" /home/app/output

exec node script.js