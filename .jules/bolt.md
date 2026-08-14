## 2024-06-25 - Hardware Acceleration for CSS Filters
**Learning:** Heavy CSS filters like `filter: blur()` behind interactive elements cause severe main-thread repaint lag in this application.
**Action:** Force them onto a separate GPU layer using `transform: translateZ(0)` and `will-change: transform` to optimize performance.
