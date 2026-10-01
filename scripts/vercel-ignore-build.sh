#!/bin/sh
# Vercel "Ignored Build Step" (vercel.json → ignoreCommand): exit 0 skips the build, exit 1 runs it.
# The Vercel plan is free, so only production (main) is built, and only when something that ships has changed:
# a commit that touches only docs, tests or CI settings does not cost a build.
if [ "$VERCEL_GIT_COMMIT_REF" != "main" ]; then
  echo "Branch $VERCEL_GIT_COMMIT_REF: no build (only main is deployed)"
  exit 0
fi
BASE="${VERCEL_GIT_PREVIOUS_SHA:-HEAD^}"
if ! git cat-file -e "$BASE^{commit}" 2>/dev/null; then
  echo "Previous deploy $BASE is not in the clone: build"
  exit 1
fi
if git diff --quiet "$BASE" HEAD -- . ':(exclude)*.md' ':(exclude)tests' ':(exclude).github'; then
  echo "Only docs, tests or CI changed since $BASE: no build"
  exit 0
fi
echo "Site changed since $BASE: build"
exit 1
