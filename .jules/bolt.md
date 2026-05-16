## 2024-05-16 - Prevent unnecessary top-level re-renders
**Learning:** In React components with multiple interactive elements (like a text input and hoverable links), placing the state at the top level causes the entire component (and all its static children) to re-render on every interaction (e.g., every keystroke or mouse movement).
**Action:** Always push state down to the lowest possible component level (e.g., `PrenomInput` or `CityLink`) to isolate re-renders and improve performance, especially when there are heavy static elements or inline styles present.
