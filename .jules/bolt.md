## 2024-08-24 - Optimizing CSS Filters for GPU Rendering
**Learning:** Heavy CSS filters like `filter: blur()` behind interactive elements cause severe main-thread repaint lag in this application.
**Action:** Force them onto a separate GPU layer using `transform: translateZ(0)` and `will-change: transform` to optimize performance.
