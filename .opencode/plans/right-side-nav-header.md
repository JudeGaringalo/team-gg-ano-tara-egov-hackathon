# Move nav items to right side of header

Move "Recycling transaction", "Report issue", and avatar details to the right side of the navigation header with proper spacing.

## Files to change

- `src/components/Trash2CashApp.tsx`
- `src/app/globals.css`

## Step 1 — JSX change (Trash2CashApp.tsx:469-476)

Remove `.header-center` div and move its content into `.header-actions` as a `<span className="header-txn">`:

```diff
 <header className="app-header">
   <Brand dark />
-  <div className="header-center">Recycling transaction <strong>{transactionId}</strong></div>
   <div className="header-actions">
+    <span className="header-txn">Recycling transaction <strong>{transactionId}</strong></span>
     <button className="report-button" onClick={() => setReportOpen(true)}>Report issue</button>
     <button className="account-button" onClick={logout}>…</button>
   </div>
 </header>
```

## Step 2 — CSS changes (globals.css)

### 2a — Replace `.app-header` grid with flex (line 431-443)

```diff
 .app-header {
   position: sticky;
   z-index: 30;
   top: 0;
-  display: grid;
+  display: flex;
   min-height: 78px;
   align-items: center;
-  grid-template-columns: 1fr auto 1fr;
+  justify-content: space-between;
   padding: 12px clamp(18px, 4vw, 64px);
   border-bottom: 1px solid var(--line);
   background: rgba(243, 243, 238, 0.93);
   backdrop-filter: blur(18px);
 }
```

### 2b — Replace `.header-center` with `.header-txn` (lines 445-455)

```diff
-.header-center {
-  color: #686d64;
-  font-size: 11px;
-  font-weight: 700;
-  letter-spacing: 0.04em;
-}
-
-.header-center strong {
-  margin-left: 5px;
-  color: var(--ink);
-}

+.header-txn {
+  color: #686d64;
+  font-size: 11px;
+  font-weight: 700;
+  letter-spacing: 0.04em;
+  margin-right: 12px;
+  white-space: nowrap;
+}
+
+.header-txn strong {
+  margin-left: 5px;
+  color: var(--ink);
+}
```

### 2c — Update `.header-actions` (line 2342-2346)

Add margin-right for right-edge spacing:

```diff
 .header-actions {
   display: flex;
   align-items: center;
   gap: 10px;
+  margin-right: -4px;
 }
```

### 2d — Update 900px responsive (lines 1915-1921)

```diff
   .app-header {
-    grid-template-columns: 1fr auto;
+    display: flex;
+    justify-content: space-between;
   }
 
-  .header-center {
+  .header-txn {
     display: none;
   }
```

### 2e — Update 560px responsive (lines 2631-2639)

```diff
 @media (max-width: 560px) {
-  .header-center,
+  .header-txn,
   .report-button,
   .account-button div {
     display: none;
   }
 
   .app-header {
-    justify-content: space-between;
+    display: flex;
+    justify-content: space-between;
   }
```

## Step 3 — Build and verify

Run `npx next build` to confirm no errors.

## Result

Before:
```
[Brand (left)]  [Recycling transaction (center)]  [Report issue | Avatar (right)]
```

After:
```
[Brand (left)]                                                  [Recycling transaction | Report issue | Avatar (right)]
```

All three right-side items are grouped together with `margin-right` providing decent edge spacing.
