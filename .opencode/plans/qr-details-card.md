# Redesign QR Details Card — Minimalist & Matching App UI

## Files to modify

### 1. `src/components/Trash2CashApp.tsx`

**Replace the entire `QrDetailsCard` function** (~lines 546-565)

Old:
```typescript
function QrDetailsCard({ data }: { data: QrNationalId }) {
  const items = [
    { label: "Date issued", value: data.DateIssued },
    { label: "Issuer", value: data.Issuer },
    { label: "First name", value: data.subject.fName },
    { label: "Middle name", value: data.subject.mName },
    { label: "Last name", value: data.subject.lName },
    { label: "Suffix", value: data.subject.Suffix || "\u2014" },
    { label: "Sex", value: data.subject.sex },
  ];
  return (
    <div className="qr-details-card">
      {items.map((item) => (
        <div className="qr-detail-row" key={item.label}>
          <span className="qr-detail-label">{item.label}</span>
          <span className="qr-detail-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
```

New:
```typescript
function QrDetailsCard({ data }: { data: QrNationalId }) {
  const fullName = [data.subject.fName, data.subject.mName, data.subject.lName]
    .filter(Boolean)
    .join(" ");
  return (
    <div className="qr-details-card">
      <div className="qr-details-header">
        <div className="qr-details-name">{fullName}</div>
        <div className="qr-details-meta">
          <span>PCN {data.subject.PCN}</span>
          <span>&middot;</span>
          <span>{data.Issuer}</span>
        </div>
      </div>
      <div className="qr-details-grid">
        <div className="qr-detail-item">
          <span className="qr-detail-label">Date issued</span>
          <span className="qr-detail-value">{data.DateIssued}</span>
        </div>
        <div className="qr-detail-item">
          <span className="qr-detail-label">Sex</span>
          <span className="qr-detail-value">{data.subject.sex}</span>
        </div>
        <div className="qr-detail-item">
          <span className="qr-detail-label">Issuer</span>
          <span className="qr-detail-value">{data.Issuer}</span>
        </div>
        <div className="qr-detail-item">
          <span className="qr-detail-label">Suffix</span>
          <span className="qr-detail-value">{data.subject.Suffix || "\u2014"}</span>
        </div>
      </div>
    </div>
  );
}
```

### 2. `src/app/globals.css`

**Replace all existing `.qr-details-*` CSS rules** (lines ~2660-2694)

Old:
```css
.qr-details-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 10px;
}

.qr-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid var(--line);
}

.qr-detail-row:last-child {
  border-bottom: none;
}

.qr-detail-label {
  font-size: 12px;
  color: var(--muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.qr-detail-value {
  font-size: 14px;
  color: var(--ink);
  font-weight: 600;
}
```

New:
```css
.qr-details-card {
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: 19px;
  background: #fbfbf8;
}

.qr-details-header {
  margin-bottom: 14px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--line);
}

.qr-details-name {
  font-size: 17px;
  font-weight: 800;
  color: var(--ink);
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.qr-details-meta {
  display: flex;
  gap: 8px;
  margin-top: 5px;
  font-size: 10px;
  color: var(--muted);
  font-weight: 600;
}

.qr-details-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.qr-detail-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.qr-detail-label {
  font-size: 10px;
  color: var(--muted);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.qr-detail-value {
  font-size: 13px;
  color: var(--ink);
  font-weight: 700;
}
```

### Visual result

```
┌──────────────────────────────────┐
│  HELEN LARAN PADECIO             │  ← 17px, 800 weight, tight letter-spacing
│  PCN 2637-2451-6975-6159 · PSA   │  ← 10px muted meta
├──────────────────────────────────┤
│ DATE ISSUED     │ SEX            │  ← 10px uppercase label
│ 20 April 2023   │ Female         │  ← 13px bold value
│                  │                │
│ ISSUER          │ SUFFIX         │
│ PSA             │ —              │
└──────────────────────────────────┘
```

Card uses `19px` border-radius (matches `.verification-card`), `#fbfbf8` background (matches `.verification-card` idle state), `--line` border (matches all cards), and the same typography patterns found throughout the app (uppercase muted labels with letter-spacing, bold ink-colored values).
