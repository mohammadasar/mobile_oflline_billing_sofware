# Android Keyboard Issue - Testing & Deployment Guide

## Root Cause Analysis

### Problem Identified
When the Android keyboard opens on Billing, Products, Customers, and Settings pages:
1. A large empty black/gray space appears above the keyboard
2. The bottom navigation can overlap input fields
3. The layout doesn't properly adjust to the keyboard height

### Root Causes Found

1. **Fixed Height Layout** (`.app-layout`)
   - CSS: `height: 100dvh` with `overflow: hidden`
   - Issue: Doesn't adapt when Android viewport shrinks for keyboard
   - Fixed: Changed to `min-height: 100dvh; max-height: 100dvh;`

2. **Fixed Bottom Navigation**
   - CSS: `position: fixed; bottom: 0; z-index: 200;`
   - Issue: Stays at bottom, gets pushed up by keyboard, overlaps content
   - Fixed: Hidden when keyboard is open via `html[data-keyboard-open="true"] .bottom-nav { display: none; }`

3. **No Keyboard State Management**
   - Issue: No way to detect or respond to keyboard show/hide events
   - Fixed: Added Capacitor Keyboard plugin integration in `main.jsx`

4. **Large Padding on Page Content**
   - CSS: `padding-bottom: calc(var(--nav-height) + var(--safe-bottom) + var(--space-6));`
   - Issue: Creates unnecessary space when keyboard is open
   - Fixed: Reduced padding when keyboard open: `padding-bottom: calc(var(--space-6) + var(--safe-bottom));`

## Changes Made

### 1. CSS Changes (`src/index.css`)

#### App Layout - Allows flexible height
```css
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;      /* Changed from: height: 100dvh; */
  max-height: 100dvh;      /* Added: prevents overflow */
  overflow: hidden;
}
```

#### Keyboard State Handling - New rules
```css
/* When keyboard is open, hide the bottom nav */
html[data-keyboard-open="true"] .bottom-nav {
  display: none;
}

/* Reduce padding when keyboard is open */
html[data-keyboard-open="true"] .page-content {
  padding-bottom: calc(var(--space-6) + var(--safe-bottom));
}

/* Ensure inputs scroll into view when focused */
input:focus,
textarea:focus {
  scroll-margin-top: calc(var(--header-height) + var(--safe-top) + var(--space-4));
  scroll-margin-bottom: calc(var(--space-4));
}
```

### 2. JavaScript Changes (`src/main.jsx`)

Added Capacitor Keyboard plugin integration:
- Listens for `keyboardWillShow` event → sets `data-keyboard-open="true"` on `<html>`
- Listens for `keyboardWillHide` event → removes the attribute
- Graceful fallback if plugin not available

### 3. Dependencies (`package.json`)

Added `@capacitor/keyboard: ^8.0.5`

### 4. Custom Hook (`src/hooks/useKeyboardAwareFocus.js`)

Created optional hook for components that need explicit focus-to-view scrolling:
```javascript
export function useKeyboardAwareFocus(inputRef) {
  const handleFocus = () => {
    if (inputRef?.current) {
      setTimeout(() => {
        inputRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  };
  return { handleFocus };
}
```

## Testing Instructions

### Prerequisites
- Android device or emulator
- Capacitor CLI: `npm install -g @capacitor/cli`
- Android Studio (for emulator or build signing)

### Setup & Build for Testing

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the web assets:**
   ```bash
   npm run build
   ```

3. **Sync to Android (first time or after changes):**
   ```bash
   npx cap sync android
   ```

4. **Run on Android:**
   ```bash
   npx cap open android
   ```
   Then build and run from Android Studio, or:
   ```bash
   npx cap run android
   ```

### Manual Test Cases

#### Test 1: Products Page Input
1. Navigate to **Products** tab
2. Click "Add" button to open product form
3. **Tap the "Product Name" input**
   - ✓ Keyboard should open
   - ✓ Bottom nav should disappear
   - ✓ No black/gray gap above keyboard
   - ✓ Input should be centered in viewport
4. **Type some text** to verify input works
5. **Tap elsewhere to close keyboard**
   - ✓ Bottom nav should reappear
   - ✓ UI should return to normal state (no visual shift)

#### Test 2: Billing Page Search
1. Navigate to **Billing** tab
2. **Tap the search input** ("Search products...")
   - ✓ Keyboard opens
   - ✓ Bottom nav hides
   - ✓ No gap or overlap
3. **Type to search** for a product
4. **Close keyboard** (tap elsewhere or back button)
   - ✓ Bottom nav reappears
   - ✓ UI stable

#### Test 3: Customers Page Form
1. Navigate to **Customers** tab
2. Click "Add" button
3. **Test each input field** in sequence:
   - Customer Name
   - Phone Number
   - Address (textarea)
   - Email
   - ✓ All should have same behavior: keyboard opens, nav hides
4. **Submit the form** with keyboard open
   - ✓ Should still work, nav hidden
5. **Close keyboard** after successful save
   - ✓ Nav reappears, list refreshes

#### Test 4: Settings Page
1. Navigate to **Settings** tab
2. **Tap input fields:**
   - Shop Name
   - Shop Phone
   - Shop Address (textarea)
   - ✓ Each should follow same pattern

#### Test 5: Rapid Keyboard Toggle
1. On any page with inputs
2. **Tap input to open keyboard**
3. **Tap back button to close keyboard** (rapid)
4. **Repeat 3-4 times**
   - ✓ No crashes
   - ✓ No visual artifacts
   - ✓ Bottom nav correctly shows/hides

#### Test 6: Orientation Change
1. **Portrait mode:** Test keyboard with form open
2. **Rotate to landscape**
   - ✓ Keyboard hidden/shown appropriately
   - ✓ Bottom nav behavior correct
3. **Rotate back to portrait**
   - ✓ Still works

#### Test 7: Keyboard Hidden State (No Input)
1. Navigate between pages WITHOUT opening any keyboard
2. **Verify bottom nav is always visible** (not hidden)
3. **UI should look identical to before the fix**

### Chrome DevTools Testing (Web Simulation)

For quick testing without Android device:

1. **Run dev server:**
   ```bash
   npm run dev
   ```

2. **Open in Chrome:** http://localhost:5173

3. **Simulate mobile:**
   - F12 → DevTools
   - Ctrl+Shift+M (or click device icon) for mobile viewport
   - Toggle "Show DevTools" drawer if hidden

4. **Simulate keyboard:**
   - Manual: The data attribute won't trigger unless Keyboard plugin is available
   - Alternative: Open DevTools console and run:
     ```javascript
     document.documentElement.setAttribute('data-keyboard-open', 'true');
     // Observe: bottom nav should hide
     document.documentElement.removeAttribute('data-keyboard-open');
     // Observe: bottom nav should reappear
     ```

## Expected Results

### Before Fix
- ❌ Keyboard opens → large empty space above keyboard
- ❌ Bottom nav overlaps input fields
- ❌ No padding adjustment
- ❌ Looks broken/unpolished

### After Fix
- ✅ Keyboard opens → no empty space, input centered
- ✅ Bottom nav automatically hides
- ✅ Padding reduces appropriately
- ✅ Keyboard closes → nav reappears, UI returns to normal
- ✅ No visual shift or layout bounce
- ✅ Input fields remain accessible and visible

## Verification Checklist

- [ ] Build completes without errors: `npm run build`
- [ ] No new ESLint warnings: `npm run lint`
- [ ] Keyboard opens on Products page input
- [ ] Keyboard opens on Billing search input
- [ ] Keyboard opens on Customers form inputs
- [ ] Keyboard opens on Settings inputs
- [ ] Bottom nav hides when keyboard is open
- [ ] Bottom nav reappears when keyboard closes
- [ ] No visual gap between keyboard and content
- [ ] Inputs are properly visible and accessible
- [ ] UI looks identical with keyboard closed
- [ ] No crashes or errors in console
- [ ] Production build created and ready for deployment

## Deployment

### Build APK for Release
```bash
npm run build
npx cap sync android
# Then in Android Studio:
# Build → Generate Signed Bundle / APK
```

### Or use Gradle directly
```bash
cd android
./gradlew app:assembleRelease
# APK available at: app/build/outputs/apk/release/
```

## Files Changed

1. `src/index.css` - CSS fixes for layout and keyboard handling
2. `src/main.jsx` - Keyboard plugin initialization
3. `package.json` - Added @capacitor/keyboard dependency
4. `src/hooks/useKeyboardAwareFocus.js` - NEW: Optional focus hook
5. `npm-shrinkwrap.json` (or package-lock.json) - Updated by npm install

## Files NOT Modified (As Required)

- ✓ License/licensing system (`src/native/license.js`)
- ✓ SQLite/database (`src/db/**`)
- ✓ Security features (`src/pages/Security/**`)
- ✓ All business logic and page components
- ✓ AndroidManifest.xml (no changes needed)

## Rollback Plan

If issues occur:
```bash
git revert <commit-hash>
npm install
npm run build
```

## Support & Documentation

For more info on Capacitor Keyboard:
- https://capacitorjs.com/docs/apis/keyboard
- https://github.com/ionic-team/capacitor-plugins/tree/main/keyboard
