Binary toggle for settings rows and per-routine overrides; track turns signal when on.

```jsx
<Switch
  checked={useGlobal}
  onChange={setUseGlobal}
  ariaLabel="Use global reminder"
/>
```

Controlled — pass `checked` and handle `onChange(next)`. Sizes `sm | md`.
