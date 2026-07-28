# Remove "Use citizen profile" tab from VerifyScreen

## Changes Required

### 1. `src/components/Trash2CashApp.tsx`

**a) Remove state variables (lines 543-552)**
```
- const [mode, setMode] = useState<"qr" | "personal">("qr");
- const [firstName, setFirstName] = useState(citizen?.first_name || "");
- const [middleName, setMiddleName] = useState(citizen?.middle_name || "");
- const [lastName, setLastName] = useState(citizen?.last_name || "");
- const [birthDate, setBirthDate] = useState(citizen?.birth_date || "");
```
Keep: `qrValue`, `busy`, `status`, `error`, `cameraOpen`, `videoRef`, `streamRef`, `scanningRef`

**b) Update error message in `startQrCamera()` (line 608)**
```
Old: "Camera permission was not granted. Paste the National ID QR value or use profile verification."
New: "Camera permission was not granted. Paste the National ID QR value instead."
```

**c) Remove `verifyWithProfile()` function (lines 682-708)**
Delete the entire function.

**d) Replace the tabs + form JSX (lines 743-765)**

Old:
```tsx
<div className="verification-tabs">
  <button className={mode === "qr" ? "active" : ""} onClick={() => { setMode("qr"); setError(""); }}>Scan National ID QR</button>
  <button className={mode === "personal" ? "active" : ""} onClick={() => { setMode("personal"); setError(""); stopCamera(); }}>Use citizen profile</button>
</div>

{mode === "qr" ? (
  <div className="verify-method-card">
    ...
  </div>
) : (
  <div className="personal-form-grid">
    <label className="field light-field"><span>First name</span><div className="field-control"><input value={firstName} onChange={(event) => setFirstName(event.target.value)} /></div></label>
    <label className="field light-field"><span>Middle name</span><div className="field-control"><input value={middleName} onChange={(event) => setMiddleName(event.target.value)} /></div></label>
    <label className="field light-field"><span>Last name</span><div className="field-control"><input value={lastName} onChange={(event) => setLastName(event.target.value)} /></div></label>
    <label className="field light-field"><span>Birth date</span><div className="field-control"><input type="date" value={birthDate} onChange={(event) => setBirthDate(event.target.value)} /></div></label>
  </div>
)}
```

New:
```tsx
<div className="verify-method-card">
  <div className="qr-camera-box">
    {cameraOpen ? <video ref={videoRef} muted playsInline aria-label="National ID QR camera" /> : <div><Icon name="camera" size={34} /><strong>National ID QR camera</strong><span>Use the rear camera and hold the QR inside the frame.</span></div>}
  </div>
  <div className="verify-controls">
    <button className="secondary-action" type="button" onClick={cameraOpen ? stopCamera : () => void startQrCamera()}>{cameraOpen ? "Stop camera" : "Open QR camera"}</button>
    <label className="field light-field"><span>QR value</span><div className="field-control"><Icon name="id" size={19} /><textarea value={qrValue} onChange={(event) => setQrValue(event.target.value)} placeholder="Scanned value appears here, or paste it manually" rows={4} /></div></label>
  </div>
</div>
```

**e) Update Screen description (line 735)**
```
Old: description="Scan the National ID QR, then complete Face Liveness. Personal-information verification is available when the QR cannot be scanned."
New: description="Scan the National ID QR, then complete Face Liveness to confirm the citizen identity."
```

**f) Update VerificationCard text (line 739)**
```
Old: text="Validate the QR or citizen information against the National ID service."
New: text="Validate the QR against the National ID service."
```

**g) Update primary action button `onClick` (line 770)**
```
Old: onClick={() => void (mode === "qr" ? verifyWithQr() : verifyWithProfile())}
New: onClick={() => void verifyWithQr()}
```

### 2. `src/app/api/everify/personal/route.ts`
Delete the entire file.

### 3. `src/lib/everify.ts`
Remove the `verifyPersonalInformation()` export function (lines 125-134).

### 4. `context/APP_CONTEXT.md`
- Remove line from directory tree: `├── everify/personal/route.ts    POST — Verify personal info + face liveness`
- Remove from the API routes table:
  `| /api/everify/personal | POST | everify | Personal info + liveness verification |`
- In the eGov Integrations table, the National ID e-Verify Notes column: remove "personal info" from the flow list
