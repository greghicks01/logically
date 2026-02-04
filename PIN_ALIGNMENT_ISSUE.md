# Pin Alignment Issue

## Status: Needs Investigation

## Problem
Multi-input gate pins (AND, OR, XOR, NAND, NOR, XNOR) are:
- ✅ Aligned vertically
- ✅ Evenly spaced
- ❌ **Offset from the visual center of the gate shape**

## What Was Fixed
1. Removed duplicated pin positioning code from 7 gate files
2. Consolidated to single source of truth: `createInputPinsAtPosition()` in `src/models/bases/MultiInputComponent.ts`
3. Fixed formula: `totalHeight = (numInputs - 1) × spacing` (removed incorrect padding)
4. Updated visual rendering components to match pin positioning formula

## Current Formula
```typescript
const spacing = 15;
const totalHeight = (numInputs - 1) * spacing;
const startY = position.y - totalHeight / 2;
```

## Files Involved
**Pin Positioning Logic:**
- `src/models/bases/MultiInputComponent.ts` - Single source of truth

**Visual Rendering:**
- `src/components/ANDGate/ANDGateComponent.tsx`
- `src/components/ORGate/ORGateComponent.tsx`
- `src/components/NANDGate/NANDGateComponent.tsx`
- `src/components/NORGate/NORGateComponent.tsx`
- `src/components/XORGate/XORGateComponent.tsx`
- `src/components/XNORGate/XNORGateComponent.tsx`

## Next Steps
- Investigate why pins are still visually offset despite matching formula
- Check if gate shape SVG paths need adjustment
- Verify `position.y` represents the visual center of the gate
