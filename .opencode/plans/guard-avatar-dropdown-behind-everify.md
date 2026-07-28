# Guard avatar dropdown behind eVerify

## Problem
The dropdown menu opens when clicking the avatar even during the verify step (before QR Verify completes). It should only open after eVerify.

## Fix

### File: `src/components/Trash2CashApp.tsx`

Change the account button onClick to only toggle when `qrVerified` is true:

```diff
-<button className="account-button" onClick={() => setAccountOpen(v => !v)}>
+<button className="account-button" onClick={() => qrVerified && setAccountOpen(v => !v)}>
```

When `!qrVerified` (before eVerify), clicking the avatar does nothing — just shows the placeholder `—` / `Citizen` as before.

## CSS

No changes.

## Build

Run `npx next build` to verify.
