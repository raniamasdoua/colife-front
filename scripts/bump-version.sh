#!/bin/bash

CURRENT_VERSION=$(node -p "require('./package.json').version")

echo "Current version: $CURRENT_VERSION"

IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# récupérer les commits depuis le dernier tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")
if [ -z "$LAST_TAG" ]; then
  COMMITS=$(git log --pretty=format:"%s")
else
  COMMITS=$(git log $LAST_TAG..HEAD --pretty=format:"%s")
fi

echo "Commits since last tag:"
echo "$COMMITS"

# logique semver
if echo "$COMMITS" | grep -q "BREAKING CHANGE\|feat!"; then
  MAJOR=$((MAJOR + 1))
  MINOR=0
  PATCH=0

elif echo "$COMMITS" | grep -q "^feat"; then
  MINOR=$((MINOR + 1))
  PATCH=0

elif echo "$COMMITS" | grep -q "^fix"; then
  PATCH=$((PATCH + 1))

else
  PATCH=$((PATCH + 1))
fi

NEW_VERSION="$MAJOR.$MINOR.$PATCH"

echo "New version: $NEW_VERSION"

# update package.json
npm version $NEW_VERSION --no-git-tag-version

echo "VERSION=$NEW_VERSION" >> $GITHUB_OUTPUT