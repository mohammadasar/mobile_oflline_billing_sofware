#!/bin/bash
# Quick Verification Script for Keyboard Fix

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Offline Billing - Android Keyboard Fix Verification      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Check if required files exist
echo "✓ Checking modified files..."
files_ok=true

if ! grep -q "min-height: 100dvh" src/index.css; then
  echo "  ✗ src/index.css: Missing 'min-height: 100dvh'"
  files_ok=false
else
  echo "  ✓ src/index.css: Has min-height 100dvh"
fi

if ! grep -q "data-keyboard-open" src/index.css; then
  echo "  ✗ src/index.css: Missing keyboard state CSS"
  files_ok=false
else
  echo "  ✓ src/index.css: Has keyboard state handling"
fi

if ! grep -q "@capacitor/keyboard" src/main.jsx; then
  echo "  ✗ src/main.jsx: Missing keyboard plugin import"
  files_ok=false
else
  echo "  ✓ src/main.jsx: Has keyboard plugin"
fi

if ! grep -q "@capacitor/keyboard" package.json; then
  echo "  ✗ package.json: Missing keyboard dependency"
  files_ok=false
else
  echo "  ✓ package.json: Has keyboard dependency"
fi

if ! [ -f "src/hooks/useKeyboardAwareFocus.js" ]; then
  echo "  ✗ src/hooks/useKeyboardAwareFocus.js: Missing file"
  files_ok=false
else
  echo "  ✓ src/hooks/useKeyboardAwareFocus.js: Exists"
fi

echo ""
if [ "$files_ok" = true ]; then
  echo "✓ All files verified!"
else
  echo "✗ Some files are missing or incomplete"
  exit 1
fi

# Check build
echo ""
echo "✓ Checking build..."
if npm run build > /dev/null 2>&1; then
  echo "  ✓ Production build successful"
else
  echo "  ✗ Production build failed"
  exit 1
fi

# Check dist exists
if [ -f "dist/index.html" ]; then
  echo "  ✓ dist/index.html generated"
else
  echo "  ✗ dist/index.html not found"
  exit 1
fi

echo ""
echo "✓ All checks passed!"
echo ""
echo "Next steps:"
echo "  1. Run: npx cap sync android"
echo "  2. Run: npx cap open android"
echo "  3. Build and run on Android device/emulator"
echo "  4. Test keyboard behavior on all pages with inputs"
echo ""
