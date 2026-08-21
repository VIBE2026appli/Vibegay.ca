## 2024-05-24 - Heavy CSS Filters causing main-thread lag
**Learning:** Heavy CSS filters like `filter: blur()` and `backdrop-filter` behind interactive elements cause severe main-thread repaint lag in this application.
**Action:** Force them onto a separate GPU layer using `transform: translateZ(0)` and `will-change: transform` to optimize performance and avoid repaints.
