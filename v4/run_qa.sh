#!/bin/bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

# 1. Automated Syntax Validation Gate for all project scripts
SYNTAX_CHECK='
var window = { appState: { user: { birthDate: "1982-11-26", age: 43.1, retireAge: 52 }, assets: [], spending: [], assumptions: { incomes: {}, decadalDecay: {}, macro: {}, rsuGrants: [] } } };
var document = { addEventListener: function() {}, getElementById: function() { return null; } };
load("'"$DIR"'/src/engine.js");
load("'"$DIR"'/src/store.js");
load("'"$DIR"'/src/ui.js");
'

if [ -f "/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc" ]; then
  /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc -e "$SYNTAX_CHECK" || {
    echo "❌ [SYNTAX ERROR] Failed to parse JavaScript source files!"
    exit 1
  }
elif command -v node >/dev/null 2>&1; then
  node -e "$SYNTAX_CHECK" || {
    echo "❌ [SYNTAX ERROR] Failed to parse JavaScript source files!"
    exit 1
  }
fi

# 2. Mathematical Benchmark Invariant Suite
if command -v node >/dev/null 2>&1; then
  node "$DIR/qa_harness.js" "$@"
elif [ -f "/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc" ]; then
  /System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc "$DIR/qa_harness.js" "$@"
else
  echo "Error: Neither node nor macOS jsc runtime found."
  exit 1
fi

