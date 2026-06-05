# GSAP Animation Fix: Preventing Vertical Jump on Tab Transitions

## Problem
When switching between sub-tabs (e.g., Gear Table/Rules, Monsters Roster/Skill plan/Teams), the content would jump vertically during GSAP slide animations.

## Root Cause
When elements receive the `.animating` class with `position: absolute`, they jump to their default position (top: 0) before GSAP applies the correct offset. This creates a visible vertical jump during transitions.

## Solution

### 1. CSS Changes
Remove `top: 0` from `.animating` classes to let GSAP fully control positioning:

**css/features/runes/hub.css:**
```css
.runes-hub-pane.animating {
  position: absolute;
  left: 0;
  right: 0;
  box-sizing: border-box;
  width: auto !important;
  /* Removed: top: 0; */
}
```

**css/features/monsters/shell.css:**
```css
.monsters-hub-pane.animating {
  position: absolute;
  left: 0;
  right: 0;
  box-sizing: border-box;
  width: auto !important;
  /* Removed: top: 0; */
}
```

### 2. JS Changes (swrm-motion.js)
Calculate dynamic `topOffset` based on navigation tabs position:

```javascript
// Calculate dynamic top offset for hub panes to prevent vertical jump
let topOffset = 0;
if (next.classList.contains('runes-hub-pane')) {
  const nav = document.getElementById('runes-hub-tabs');
  if (nav) {
    const navStyle = window.getComputedStyle(nav);
    const marginBottom = parseFloat(navStyle.marginBottom) || 0;
    topOffset = nav.offsetTop + nav.offsetHeight + marginBottom;
  }
} else if (next.classList.contains('monsters-hub-pane')) {
  const nav = document.getElementById('monsters-hub-tabs');
  if (nav) {
    const navStyle = window.getComputedStyle(nav);
    const marginBottom = parseFloat(navStyle.marginBottom) || 0;
    topOffset = nav.offsetTop + nav.offsetHeight + marginBottom;
  }
} else if (next.classList.contains('table-kind-pane')) {
  const nav = document.getElementById('table-kind-tabs');
  if (nav) {
    const navStyle = window.getComputedStyle(nav);
    const marginBottom = parseFloat(navStyle.marginBottom) || 0;
    topOffset = nav.offsetTop + nav.offsetHeight + marginBottom;
  }
}
```

Apply `topOffset` to both current and next elements:

```javascript
if (current) {
  current.classList.add('animating');
  gsap.set(current, { x: 0, opacity: 1, top: topOffset });
}

gsap.set(next, { x: startX, opacity: 0, top: topOffset });
```

## Key Formula
```
topOffset = nav.offsetTop + nav.offsetHeight + marginBottom
```

This calculates the exact distance from the parent's top to the content below the navigation tabs, ensuring smooth transitions without vertical jumps.

## Files Modified
- `css/features/runes/hub.css` - Removed `top: 0` from `.runes-hub-pane.animating`
- `css/features/monsters/shell.css` - Removed `top: 0` from `.monsters-hub-pane.animating`
- `js/swrm-motion.js` - Added dynamic `topOffset` calculation for hub panes

## Build Commands
After making changes:
```bash
npm run build:css  # For CSS changes
npm run build:ui   # For JS changes
```
