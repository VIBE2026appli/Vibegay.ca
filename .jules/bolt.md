## 2024-05-24 - Force heavy CSS filters onto GPU layer
**Learning:** Heavy CSS filters like `filter: blur()` behind interactive elements cause severe main-thread repaint lag in this application.
**Action:** Force them onto a separate GPU layer using `transform: translateZ(0)` and `will-change: transform` to optimize performance.