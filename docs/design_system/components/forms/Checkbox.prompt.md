Boolean checkbox for multi-select (weekly day-of-week, export filters).

```jsx
<Checkbox checked={days.mon} label="Mon" onChange={(v) => setDay("mon", v)} />
```

Controlled. Filled with signal + white check when on. For single on/off settings prefer `Switch`.
