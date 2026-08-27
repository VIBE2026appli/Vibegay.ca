## 2026-05-18 - [Push State Down]
**Learning:** In a React application, a component's state dictates its re-renders. A top-level component holding state that changes frequently (like input fields or hover states) causes the entire component tree below it to re-render. Extracting these states into smaller, localized components prevents unnecessary global re-renders.
**Action:** Extract components handling specific, rapidly changing states (like text inputs or hover handlers) from their parent components, especially when the parent contains static or heavy components.
