## 2024-05-14 - GPU Acceleration for Heavy CSS Filters
**Learning:** Heavy CSS filters like `filter: blur()` and `backdropFilter: blur()` behind interactive elements cause severe main-thread repaint lag in this application.
**Action:** Force them onto a separate GPU layer using `transform: translateZ(0)` and `will-change: transform` to optimize performance and prevent main-thread blocking.