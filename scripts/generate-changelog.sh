#!/bin/bash

LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null)

if [ -z "$LAST_TAG" ]; then
  COMMITS=$(git log --pretty=format:"- %s")
else
  COMMITS=$(git log $LAST_TAG..HEAD --pretty=format:"- %s")
fi

VERSION=$1

DATE=$(date +'%Y-%m-%d')

echo "## v$VERSION - $DATE" > temp_changelog.md
echo "" >> temp_changelog.md
echo "### 🚀 Features & Fixes" >> temp_changelog.md
echo "$COMMITS" >> temp_changelog.md
echo "" >> temp_changelog.md

cat CHANGELOG.md temp_changelog.md > CHANGELOG_NEW.md 2>/dev/null || cat temp_changelog.md > CHANGELOG_NEW.md

mv CHANGELOG_NEW.md CHANGELOG.md

echo "CHANGELOG generated"