## 2026-05-18 - [Push State Down]
**Learning:** In a React application, a component's state dictates its re-renders. A top-level component holding state that changes frequently (like input fields or hover states) causes the entire component tree below it to re-render. Extracting these states into smaller, localized components prevents unnecessary global re-renders.
**Action:** Extract components handling specific, rapidly changing states (like text inputs or hover handlers) from their parent components, especially when the parent contains static or heavy components.

## 2026-05-18 - [GPU Acceleration for Heavy Filters]
**Learning:** Heavy CSS filters like `filter: blur()` behind interactive elements cause severe main-thread repaint lag in this application. Applying these filters to elements without explicitly separating them onto their own layers forces the browser to repaint them repeatedly during interactions.
**Action:** Force heavy CSS filters onto a separate GPU layer using `transform: translateZ(0)` and `will-change: transform` to optimize performance and prevent main-thread lag.
