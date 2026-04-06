#!/bin/bash
set -e

echo "📦 Génération du changelog..."

VERSION=$1
DATE=$(date +'%Y-%m-%d')

# dernier tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

if [ -z "$LAST_TAG" ]; then
  COMMITS=$(git log --pretty=format:"%s")
else
  COMMITS=$(git log $LAST_TAG..HEAD --pretty=format:"%s")
fi

# extraction par type
FEATURES=$(echo "$COMMITS" | grep "^feat" || true)
FIXES=$(echo "$COMMITS" | grep "^fix" || true)
OTHERS=$(echo "$COMMITS" | grep -E "^(chore|docs|refactor|test|ci)" || true)

# création du bloc
{
  echo "## v$VERSION - $DATE"
  echo ""

  if [ -n "$FEATURES" ]; then
    echo "### 🚀 Features"
    echo "$FEATURES" | sed 's/^/- /'
    echo ""
  fi

  if [ -n "$FIXES" ]; then
    echo "### 🐛 Fixes"
    echo "$FIXES" | sed 's/^/- /'
    echo ""
  fi

  if [ -n "$OTHERS" ]; then
    echo "### 🔧 Others"
    echo "$OTHERS" | sed 's/^/- /'
    echo ""
  fi

  echo "---"
  echo ""
} > temp_changelog.md

# création ou mise à jour du fichier
if [ -f CHANGELOG.md ]; then
  cat temp_changelog.md CHANGELOG.md > CHANGELOG_NEW.md
else
  echo "# Changelog" > CHANGELOG_NEW.md
  echo "" >> CHANGELOG_NEW.md
  cat temp_changelog.md >> CHANGELOG_NEW.md
fi

mv CHANGELOG_NEW.md CHANGELOG.md
rm temp_changelog.md