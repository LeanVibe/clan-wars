# Three.js Battlefield Canvas Troubleshooting Guide

## Issue Resolved: Black Canvas / No 3D Rendering

### Problem Description
The Three.js battlefield canvas was displaying as a black area instead of showing the 3D scene with colored lane meshes and unit representations.

### Root Cause
**Canvas Sizing Timing Issue**: The WebGL renderer was being initialized before the CSS layout had fully resolved, causing the canvas to have zero dimensions (`0x0`) when `firstUpdated()` executed.

### Solution Implementation

#### 1. Deferred Initialization
```javascript
firstUpdated() {
  const canvas = this.renderRoot.querySelector('canvas');
  if (!canvas) {
    console.warn('Canvas element not found');
    return;
  }

  // Wait for layout to settle before initializing Three.js
  requestAnimationFrame(() => {
    this.#initializeThreeJS(canvas);
  });
}
```

#### 2. Robust Dimension Detection
```javascript
#initializeThreeJS(canvas) {
  const wrapper = canvas.parentElement;
  const rect = wrapper.getBoundingClientRect();
  const width = rect.width || 400;  // Fallback dimensions
  const height = rect.height || 500;

  if (width === 0 || height === 0) {
    console.warn('Canvas has zero dimensions, retrying...');
    setTimeout(() => this.#initializeThreeJS(canvas), 100);
    return;
  }
  // ... rest of initialization
}
```

#### 3. ResizeObserver for Responsiveness
```javascript
const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    const { width: newWidth, height: newHeight } = entry.contentRect;
    if (newWidth > 0 && newHeight > 0) {
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    }
  }
});
resizeObserver.observe(wrapper);
```

#### 4. Enhanced Error Handling & Debugging
```javascript
try {
  renderer = new THREE.WebGLRenderer({ 
    canvas, 
    antialias: true, 
    alpha: true,
    preserveDrawingBuffer: false
  });
  console.log('WebGL renderer created successfully');
  console.log('Renderer info:', renderer.info);
} catch (error) {
  console.error('Failed to create WebGL renderer:', error);
  return;
}
```

#### 5. Visual Validation Test Cube
Added a rotating red test cube to verify that:
- WebGL context is working
- Scene is rendering
- Animation loop is running
- Camera positioning is correct

## Diagnostic Tools Added

### Console Debugging
- Canvas dimensions logging
- WebGL renderer creation status
- Lane mesh creation confirmation
- Test cube animation verification

### Visual Confirmation
- Red rotating test cube at `(0, 1, 0)` position
- Lane meshes with distinct colors (orange/green/blue)
- Proper lighting setup with ambient + directional lights

## Testing Checklist

When debugging Three.js rendering issues:

1. **Check Browser Console**:
   - Look for WebGL errors
   - Verify canvas dimensions > 0
   - Confirm renderer creation success

2. **Verify Scene Elements**:
   - Test cube should be visible and rotating
   - Lane meshes should appear as colored horizontal planes
   - Units should render as colored boxes

3. **Camera Positioning**:
   - Position: `(0, 4.2, 6.5)`
   - Looking at: `(0, 0, 0)`
   - FOV: 45 degrees

4. **Lighting Setup**:
   - Ambient light: `#6ec8d8` at 0.6 intensity
   - Directional light: `#fef3c7` at 0.8 intensity from `(3, 6, 5)`

## Common Issues & Solutions

### Issue: Canvas Still Black
- **Check**: WebGL support in browser
- **Check**: Canvas has non-zero dimensions
- **Solution**: Verify WebGL context creation and fallback gracefully

### Issue: Objects Not Visible
- **Check**: Camera position and lookAt target
- **Check**: Object positions are within camera view frustum
- **Solution**: Add test geometry at origin for baseline visibility

### Issue: Performance Problems
- **Check**: Pixel ratio not exceeding 2x
- **Check**: Geometry complexity (16x16 segments for planes)
- **Solution**: Optimize mesh count and material complexity

### Issue: Responsive Layout Problems
- **Check**: ResizeObserver is attached and functioning
- **Check**: Camera aspect ratio updates on resize
- **Solution**: Ensure renderer.setSize() called on dimension changes

## Files Modified

- `apps/pwa/src/components/ninja-battle-canvas.js`: Complete Three.js initialization overhaul
- Enhanced error handling, debugging, and responsive canvas management

## Future Enhancements

1. **WebGL Fallback**: Add Canvas 2D fallback for unsupported devices
2. **Performance Monitoring**: Track FPS and render times
3. **Device-Specific Optimization**: Adjust quality based on device capabilities
4. **Memory Management**: Implement geometry disposal for dynamic units