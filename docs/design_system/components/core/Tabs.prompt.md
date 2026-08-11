Underline tab bar — analytics period switcher (Daily/Weekly/Monthly/Yearly), routine views.

```jsx
<Tabs
  value={tab}
  onChange={setTab}
  items={[
    { value: "day", label: "Daily" },
    { value: "week", label: "Weekly" },
    { value: "month", label: "Monthly", count: 4 },
  ]}
/>
```

Active tab gets ink text + a signal underline. Optional `count` renders as a mono superscript-style number.
