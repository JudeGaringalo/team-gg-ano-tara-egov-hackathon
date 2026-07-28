# Replace BarcodeDetector with jsQR

## Step 1: Install jsqr

```bash
npm install jsqr
```

Already done — package is installed.

## Step 2: `src/components/Trash2CashApp.tsx` — 3 edits

### 2a. Add import (after line 11)

After:
```typescript
import { QRCodeSVG } from "qrcode.react";
```
Add:
```typescript
import jsQR from "jsqr";
```

### 2b. Remove BarcodeDetector type (lines 73-75)

Remove these 3 lines from the `Window` interface:
```typescript
    BarcodeDetector?: new (options?: { formats?: string[] }) => {
      detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
    };
```

### 2c. Replace `startQrCamera()` function (lines 561-605)

**Old code:**
```typescript
  async function startQrCamera() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is not supported in this browser. Paste the QR value instead.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
      await wait(80);
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      if (!window.BarcodeDetector) {
        setError("Live QR detection is not available in this browser. You may still photograph the QR and paste its encoded value.");
        return;
      }

      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      scanningRef.current = true;
      const scan = async () => {
        if (!scanningRef.current || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          const found = codes.find((item) => item.rawValue)?.rawValue;
          if (found) {
            setQrValue(found);
            stopCamera();
            return;
          }
        } catch {
          // Keep scanning while the camera is warming up.
        }
        window.setTimeout(scan, 350);
      };
      void scan();
    } catch (cameraError) {
      console.error(cameraError);
      stopCamera();
      setError("Camera permission was not granted. Paste the National ID QR value instead.");
    }
  }
```

**New code:**
```typescript
  async function startQrCamera() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera access is not supported in this browser. Paste the QR value instead.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
      streamRef.current = stream;
      setCameraOpen(true);
      await wait(80);
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      scanningRef.current = true;
      const scan = () => {
        if (!scanningRef.current || !videoRef.current) return;
        try {
          if (videoRef.current.readyState >= 2) {
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            ctx.drawImage(videoRef.current, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height);
            if (code) {
              setQrValue(code.data);
              stopCamera();
              return;
            }
          }
        } catch {
          // Keep scanning while the camera is warming up.
        }
        window.setTimeout(scan, 350);
      };
      void scan();
    } catch (cameraError) {
      console.error(cameraError);
      stopCamera();
      setError("Camera permission was not granted. Paste the National ID QR value instead.");
    }
  }
```

## Step 3: Verify build

```bash
npx next build
```

Check that the route list no longer includes `everify/personal` and no compilation errors occur.
