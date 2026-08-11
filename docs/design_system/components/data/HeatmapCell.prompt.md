Building block for the yearly discipline heatmap (one cell per day).

```jsx
{
  days.map((d) => (
    <HeatmapCell
      key={d.date}
      rate={d.rate}
      title={`${d.date} · ${Math.round(d.rate * 100)}%`}
    />
  ))
}
```

Pass `rate` (0–1) to auto-bucket onto the 5-step discipline ramp, or `level` (0–4) directly. Lay out 7 rows (weekdays) × 53 columns with a small gap.
