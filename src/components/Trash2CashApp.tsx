"use client";

import {
  type ChangeEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { QRCodeSVG } from "qrcode.react";
import jsQR from "jsqr";

type Step =
  | "login"
  | "verify"
  | "capture"
  | "estimate"
  | "center"
  | "validation"
  | "reward"
  | "wallet"
  | "paymentQr"
  | "points"
  | "complete";

type RewardType = "cash" | "points";
type Wallet = "GCash" | "Maya" | "Bank Account";

type MaterialResult = {
  name: string;
  quantity: number;
  estimatedWeight: number;
  cashRate: number;
  pointRate: number;
  confidence: number;
  rawLabel: string;
};

type CitizenProfile = {
  uniqid?: string;
  email?: string;
  birth_date?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  suffix?: string | null;
  gender?: string;
  mobile?: string;
  mobile_number?: string;
  photo?: string;
  address?: string;
  barangay_code?: string;
  province_code?: string;
  municipality_code?: string;
  region_code?: string;
  [key: string]: unknown;
};

type EVerifySdkResult = {
  session_id?: string;
  photo?: string;
  photo_url?: string;
  error?: string;
};

type EVerifySdk = {
  start: (options: { pubKey: string }) => Promise<EVerifySdkResult>;
};

declare global {
  interface Window {
    eKYC?: () => EVerifySdk;
  }
}
type IconName =
  | "arrow"
  | "back"
  | "camera"
  | "check"
  | "coins"
  | "eye"
  | "id"
  | "leaf"
  | "location"
  | "lock"
  | "logout"
  | "recycle"
  | "scale"
  | "sparkles"
  | "upload"
  | "user"
  | "wallet";

type Center = {
  id: string;
  name: string;
  address: string;
  distance: string;
  schedule: string;
  queue: string;
  accepts: string;
};

const DEFAULT_MATERIAL: MaterialResult = {
  name: "PET Plastic Bottles",
  quantity: 12,
  estimatedWeight: 1.5,
  cashRate: 30,
  pointRate: 100,
  confidence: 96,
  rawLabel: "plastic bottle",
};

type ImagePrediction = {
  className: string;
  probability: number;
};

function mapImagePrediction(predictions: ImagePrediction[]): MaterialResult {
  const best = predictions[0];
  const label = (best?.className || "mixed recyclables").toLowerCase();
  const confidence = Math.max(55, Math.round((best?.probability || 0.55) * 100));

  if (/(water bottle|pop bottle|plastic bottle|soda bottle)/.test(label)) {
    return { ...DEFAULT_MATERIAL, confidence, rawLabel: label };
  }

  if (/(beer bottle|wine bottle|glass)/.test(label)) {
    return { name: "Glass Bottles", quantity: 4, estimatedWeight: 1.8, cashRate: 4, pointRate: 30, confidence, rawLabel: label };
  }

  if (/(can|tin|aluminum)/.test(label)) {
    return { name: "Aluminum or Metal Cans", quantity: 6, estimatedWeight: 0.5, cashRate: 55, pointRate: 140, confidence, rawLabel: label };
  }

  if (/(carton|cardboard|box)/.test(label)) {
    return { name: "Cardboard", quantity: 3, estimatedWeight: 2, cashRate: 12, pointRate: 45, confidence, rawLabel: label };
  }

  if (/(paper|newspaper|notebook)/.test(label)) {
    return { name: "Paper", quantity: 20, estimatedWeight: 1.2, cashRate: 8, pointRate: 35, confidence, rawLabel: label };
  }

  if (/(laptop|computer|monitor|cellular telephone|mobile phone|keyboard)/.test(label)) {
    return { name: "Small Electronic Waste", quantity: 1, estimatedWeight: 0.8, cashRate: 20, pointRate: 90, confidence, rawLabel: label };
  }

  return { name: "Mixed Recyclable Materials", quantity: 1, estimatedWeight: 1, cashRate: 15, pointRate: 60, confidence, rawLabel: label };
}

async function loadImageElement(src: string): Promise<HTMLImageElement> {
  const image = new window.Image();
  image.src = src;

  if (typeof image.decode === "function") {
    await image.decode();
    return image;
  }

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("The selected image could not be loaded."));
  });

  return image;
}

const CENTERS: Center[] = [
  {
    id: "central",
    name: "Barangay Central MRF",
    address: "Community Eco Center, Barangay Central",
    distance: "0.8 km away",
    schedule: "Open until 5:00 PM",
    queue: "Low queue",
    accepts: "Plastic, paper, cans",
  },
  {
    id: "green-cycle",
    name: "GreenCycle Partner Junkshop",
    address: "Commonwealth Avenue Collection Point",
    distance: "2.1 km away",
    schedule: "Open until 6:00 PM",
    queue: "Moderate queue",
    accepts: "Plastic, cardboard, metal",
  },
  {
    id: "city-mrf",
    name: "City Materials Recovery Facility",
    address: "Environmental Services Compound",
    distance: "3.4 km away",
    schedule: "Open until 4:30 PM",
    queue: "Low queue",
    accepts: "Plastic, paper, e-waste",
  },
];

const FLOW_STEPS = [
  { key: "verify", label: "Verify" },
  { key: "capture", label: "Capture" },
  { key: "estimate", label: "Estimate" },
  { key: "center", label: "Drop-off" },
  { key: "validation", label: "Validate" },
  { key: "reward", label: "Reward" },
  { key: "wallet", label: "Receive" },
  { key: "complete", label: "Complete" },
] as const;

function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  const content: Record<IconName, ReactNode> = {
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    back: <><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></>,
    camera: <><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="4"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    coins: <><ellipse cx="9" cy="7" rx="5" ry="3"/><path d="M4 7v4c0 1.7 2.2 3 5 3 1 0 2-.2 2.8-.6"/><ellipse cx="16" cy="15" rx="5" ry="3"/><path d="M11 15v4c0 1.7 2.2 3 5 3s5-1.3 5-3v-4"/></>,
    eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.8"/></>,
    id: <><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5.5 16c.7-2 4.3-2 5 0M13 9h5M13 13h5"/></>,
    leaf: <><path d="M20 4C10 4 5 9 5 15c0 3 2 5 5 5 6 0 10-6 10-16Z"/><path d="M5 20c2-5 6-8 11-11"/></>,
    location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    logout: <><path d="M10 5H5v14h5"/><path d="M14 8l4 4-4 4M9 12h9"/></>,
    recycle: <><path d="m7 6 2-3 2 3"/><path d="M9 3v5H5"/><path d="m17 8 3 1-2 3"/><path d="m20 9-4 7-2-3"/><path d="m8 18-3-1 2-3"/><path d="m5 17 8 1 1-3"/></>,
    scale: <><path d="M12 3v17M5 7h14M7 7l-3 6h6L7 7Zm10 0-3 6h6l-3-6ZM8 21h8"/></>,
    sparkles: <><path d="m12 3 1.4 3.6L17 8l-3.6 1.4L12 13l-1.4-3.6L7 8l3.6-1.4Z"/><path d="m18 14 .8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8Z"/></>,
    upload: <><path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 15v5h16v-5"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></>,
    wallet: <><path d="M4 6h15a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13"/><path d="M16 11h5v4h-5a2 2 0 1 1 0-4Z"/></>,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {content[name]}
    </svg>
  );
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(value);
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export default function Trash2CashApp() {
  const [step, setStep] = useState<Step>("login");
  const [citizen, setCitizen] = useState<CitizenProfile | null>(null);
  const [loginBusy, setLoginBusy] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [material, setMaterial] = useState<MaterialResult>(DEFAULT_MATERIAL);
  const [aiGuidance, setAiGuidance] = useState("");
  const [selectedCenter, setSelectedCenter] = useState(CENTERS[0].id);
  const [actualWeight, setActualWeight] = useState(DEFAULT_MATERIAL.estimatedWeight);
  const [rewardType, setRewardType] = useState<RewardType>("cash");
  const [wallet, setWallet] = useState<Wallet>("GCash");
  const [account, setAccount] = useState("0917 123 4567");
  const [toast, setToast] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCenterData = CENTERS.find((center) => center.id === selectedCenter) ?? CENTERS[0];
  const finalCash = actualWeight * material.cashRate;
  const finalPoints = Math.round(actualWeight * material.pointRate);
  const transactionId = "T2C-A7F392";
  const qrPayload = JSON.stringify({ transactionId, wallet, amount: finalCash.toFixed(2), currency: "PHP" });

  const normalizedStep = step === "paymentQr" || step === "points" ? "wallet" : step;
  const activeIndex = useMemo(() => FLOW_STEPS.findIndex((item) => item.key === normalizedStep), [normalizedStep]);

  useEffect(() => {
    const stored = window.sessionStorage.getItem("trash2cash-citizen");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CitizenProfile;
        setCitizen(parsed);
        setStep("verify");
      } catch {
        window.sessionStorage.removeItem("trash2cash-citizen");
      }
    }

  }, []);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }

  async function startSession() {
    setLoginBusy(true);
    await wait(450);
    const profile: CitizenProfile = {
      uniqid: "HACKATHON-CITIZEN-001",
      first_name: "Lester",
      last_name: "Garingalo",
      email: "lesterjudeag@gmail.com",
      mobile: "+639171234567",
      birth_date: "1995-12-02",
      gender: "Male",
      region_code: "130000000",
      province_code: "138000000",
      municipality_code: "138130000",
      barangay_code: "138130012",
    };
    setCitizen(profile);
    window.sessionStorage.setItem("trash2cash-citizen", JSON.stringify(profile));
    setLoginBusy(false);
    setStep("verify");
    notify("Citizen session started");
  }

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (photo && photo !== "sample") URL.revokeObjectURL(photo);
    setPhoto(URL.createObjectURL(file));
    setMaterial(DEFAULT_MATERIAL);
    setAiGuidance("");
  }

  function useSamplePhoto() {
    setPhoto("sample");
    setMaterial(DEFAULT_MATERIAL);
    setActualWeight(DEFAULT_MATERIAL.estimatedWeight);
    setAiGuidance("");
    notify("Recyclable materials added");
  }

  async function analyzePhoto() {
    if (!photo) return;

    setAnalyzing(true);
    try {
      let result = DEFAULT_MATERIAL;
      if (photo !== "sample") {
        const tf = await import("@tensorflow/tfjs");
        const mobilenet = await import("@tensorflow-models/mobilenet");
        await tf.ready();
        const model = await mobilenet.load({ version: 2, alpha: 0.5 });
        const image = await loadImageElement(photo);
        const predictions = (await model.classify(image, 3)) as ImagePrediction[];
        result = mapImagePrediction(predictions);
      }

      setMaterial(result);
      setActualWeight(result.estimatedWeight);

      try {
        const response = await fetch("/api/egov-ai/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ material: result.name }),
        });
        const payload = (await response.json()) as { answer?: string; error?: string };
        if (!response.ok) throw new Error(payload.error || "eGov AI guidance is temporarily unavailable.");
        setAiGuidance(payload.answer || "Prepare the materials clean, dry, and separated before drop-off.");
      } catch (error) {
        console.error(error);
        setAiGuidance("Keep the materials clean, dry, and separated. The accredited collection center will confirm the accepted type, final weight, and reward.");
      }

      setStep("estimate");
      notify("Material analysis completed");
    } catch (error) {
      console.error("Image recognition failed:", error);
      setMaterial(DEFAULT_MATERIAL);
      setActualWeight(DEFAULT_MATERIAL.estimatedWeight);
      setAiGuidance("Keep the materials clean, dry, and separated. The accredited collection center will confirm the accepted type, final weight, and reward.");
      setStep("estimate");
      notify("Material added for manual confirmation");
    } finally {
      setAnalyzing(false);
    }
  }

  function logout() {
    window.sessionStorage.removeItem("trash2cash-citizen");
    setCitizen(null);
    setStep("login");
    setPhoto(null);
    setActualWeight(DEFAULT_MATERIAL.estimatedWeight);
    setRewardType("cash");
    setWallet("GCash");
    setMaterial(DEFAULT_MATERIAL);
    setAiGuidance("");
  }

  function restart() {
    setPhoto(null);
    setActualWeight(DEFAULT_MATERIAL.estimatedWeight);
    setMaterial(DEFAULT_MATERIAL);
    setAiGuidance("");
    setRewardType("cash");
    setWallet("GCash");
    setStep("capture");
  }

  function goBack() {
    const previous: Partial<Record<Step, Step>> = {
      verify: "login",
      capture: "verify",
      estimate: "capture",
      center: "estimate",
      validation: "center",
      reward: "validation",
      wallet: "reward",
      paymentQr: "wallet",
      points: "reward",
      complete: rewardType === "cash" ? "paymentQr" : "points",
    };
    setStep(previous[step] ?? "login");
  }

  const displayName = [citizen?.first_name, citizen?.last_name].filter(Boolean).join(" ") || "Citizen";
  const initials = displayName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  if (step === "login") {
    return (
      <div className="login-page">
        <header className="login-header">
          <Brand />
          <span className="secure-chip"><Icon name="lock" size={15} /> Secure citizen access</span>
        </header>

        <main className="login-grid">
          <section className="login-story">
            <div className="story-copy">
              <span className="overline light">Verified recycling rewards</span>
              <h1>TURN WASTE<br />INTO <em>VALUE.</em></h1>
              <p>Identify recyclable materials, validate them at an accredited collection center, and receive cash or Green Points through one secure flow.</p>
            </div>
            <div className="story-visual" aria-hidden="true">
              <div className="metal-ring"><Icon name="recycle" size={112} /></div>
              <span className="orbit-label label-one">AI assessment</span>
              <span className="orbit-label label-two">Verified drop-off</span>
              <span className="orbit-label label-three">Secure reward</span>
            </div>
            <div className="story-footer">
              <span>National ID e-Verify</span><span>Face Liveness</span><span>eGov AI</span><span>eReport</span><span>eGovPay</span><span>eMessage</span>
            </div>
          </section>

          <section className="login-panel-wrap">
            <div className="login-panel">
              <span className="panel-number">01 / Start recycling</span>
              <h2>Start your recycling session</h2>
              <p>Identify recyclable materials, validate them at an accredited collection center, and receive cash or Green Points through one secure flow.</p>

              <button className="primary-action full-action" disabled={loginBusy} onClick={() => void startSession()}>
                <span>{loginBusy ? "Starting session…" : "Start session"}</span><Icon name="arrow" />
              </button>

              <div className="login-note"><Icon name="lock" size={16} /><p>This is a venue testing session for the hackathon demonstration.</p></div>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <Brand dark />
        <div className="header-center">Recycling transaction <strong>{transactionId}</strong></div>
        <div className="header-actions">
          <button className="report-button" onClick={() => setReportOpen(true)}>Report issue</button>
          <button className="account-button" onClick={logout}><span>{initials}</span><div><strong>{displayName}</strong><small>{step === "verify" ? "Citizen session" : "Verified citizen"}</small></div><Icon name="logout" size={18} /></button>
        </div>
      </header>

      <ProgressBar activeIndex={activeIndex} />

      <main className="workspace">
        <div className="workspace-heading">
          <button className="back-button" onClick={goBack}><Icon name="back" size={18} /> Back</button>
          <span>{Math.max(activeIndex + 1, 1).toString().padStart(2, "0")} / 08</span>
        </div>

        {step === "verify" && <VerifyScreen citizen={citizen} onVerified={(verified) => { setCitizen((current) => ({ ...(current || {}), ...verified })); setStep("capture"); notify("National ID and Face Liveness verified"); }} />}
        {step === "capture" && <CaptureScreen photo={photo} inputRef={inputRef} onPhoto={handlePhoto} onSample={useSamplePhoto} analyzing={analyzing} onAnalyze={analyzePhoto} />}
        {step === "estimate" && <EstimateScreen material={material} guidance={aiGuidance} onContinue={() => setStep("center")} />}
        {step === "center" && <CenterScreen material={material} selected={selectedCenter} onSelect={setSelectedCenter} onContinue={() => setStep("validation")} />}
        {step === "validation" && <ValidationScreen material={material} center={selectedCenterData} weight={actualWeight} setWeight={setActualWeight} cash={finalCash} points={finalPoints} onContinue={() => setStep("reward")} />}
        {step === "reward" && <RewardScreen type={rewardType} setType={setRewardType} cash={finalCash} points={finalPoints} onContinue={() => setStep(rewardType === "cash" ? "wallet" : "points")} />}
        {step === "wallet" && <WalletScreen wallet={wallet} setWallet={setWallet} account={account} setAccount={setAccount} cash={finalCash} onContinue={() => setStep("paymentQr")} />}
        {step === "paymentQr" && <PaymentQrScreen material={material} wallet={wallet} cash={finalCash} transactionId={transactionId} payload={qrPayload} onContinue={() => setStep("complete")} />}
        {step === "points" && <PointsScreen points={finalPoints} onContinue={() => setStep("complete")} />}
        {step === "complete" && <CompleteScreen citizen={citizen} material={material} rewardType={rewardType} wallet={wallet} cash={finalCash} points={finalPoints} weight={actualWeight} center={selectedCenterData} transactionId={transactionId} onRestart={restart} />}
      </main>

      {reportOpen && <ReportModal citizen={citizen} transactionId={transactionId} onClose={() => setReportOpen(false)} />}
      {toast && <div className="toast"><span><Icon name="check" size={16} /></span>{toast}</div>}
    </div>
  );
}
function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <div className={dark ? "brand dark" : "brand"}>
      <span className="brand-mark"><Icon name="recycle" size={23} /></span>
      <strong>TRASH2CASH</strong>
    </div>
  );
}

function ProgressBar({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="progress-wrap">
      <div className="progress-track">
        {FLOW_STEPS.map((item, index) => (
          <div className={index < activeIndex ? "progress-item done" : index === activeIndex ? "progress-item active" : "progress-item"} key={item.key}>
            <span>{index < activeIndex ? <Icon name="check" size={14} /> : index + 1}</span>
            <small>{item.label}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

function Screen({ eyebrow, title, description, aside, children }: { eyebrow: string; title: string; description: string; aside: ReactNode; children: ReactNode }) {
  return (
    <section className="screen-grid">
      <div className="screen-main">
        <span className="overline">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="screen-description">{description}</p>
        <div className="screen-content">{children}</div>
      </div>
      <aside className="screen-aside">{aside}</aside>
    </section>
  );
}

function VerifyScreen({ citizen, onVerified }: { citizen: CitizenProfile | null; onVerified: (profile: CitizenProfile) => void }) {
  const [qrValue, setQrValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "qr" | "face" | "done">("idle");
  const [error, setError] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);

  useEffect(() => () => stopCamera(), []);

  function stopCamera() {
    scanningRef.current = false;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

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

  async function runFaceLiveness(): Promise<string> {
    setStatus("face");
    const configResponse = await fetch("/api/everify/config", { cache: "no-store" });
    const config = (await configResponse.json()) as { publicKey?: string; sdkUrl?: string; error?: string };
    if (!configResponse.ok || !config.publicKey || !config.sdkUrl) throw new Error(config.error || "Face Liveness configuration is unavailable.");
    const publicKey = config.publicKey;
    const sdkUrl = config.sdkUrl;

    if (!window.eKYC) {
      await new Promise<void>((resolve, reject) => {
        const existing = document.querySelector<HTMLScriptElement>(`script[src="${sdkUrl}"]`);
        if (existing) {
          if (window.eKYC) resolve();
          else {
            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener("error", () => reject(new Error("Unable to load the Face Liveness SDK.")), { once: true });
          }
          return;
        }
        const script = document.createElement("script");
        script.src = sdkUrl;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Unable to load the Face Liveness SDK."));
        document.head.appendChild(script);
      });
    }

    if (!window.eKYC) throw new Error("Face Liveness did not initialize in this browser.");
    const result = await window.eKYC().start({ pubKey: publicKey });
    if (!result.session_id) throw new Error(result.error || "Face Liveness did not return a valid session.");
    return result.session_id;
  }

  async function verifyWithQr() {
    if (!qrValue.trim()) {
      setError("Scan or paste the National ID QR value first.");
      return;
    }
    setBusy(true);
    setError("");
    setStatus("qr");
    try {
      const checkResponse = await fetch("/api/everify/qr-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: qrValue.trim() }),
      });
      const checked = (await checkResponse.json()) as { profile?: CitizenProfile; error?: string };
      if (!checkResponse.ok) throw new Error(checked.error || "The National ID QR could not be checked.");

      const sessionId = await runFaceLiveness();
      const verifyResponse = await fetch("/api/everify/qr-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: qrValue.trim(), faceLivenessSessionId: sessionId }),
      });
      const verified = (await verifyResponse.json()) as { profile?: CitizenProfile; error?: string };
      if (!verifyResponse.ok || !verified.profile) throw new Error(verified.error || "National ID verification was not completed.");
      setStatus("done");
      await wait(300);
      onVerified({ ...(checked.profile || {}), ...verified.profile });
    } catch (verifyError) {
      setStatus("idle");
      setError(verifyError instanceof Error ? verifyError.message : "National ID verification failed.");
    } finally {
      setBusy(false);
    }
  }

  async function useEventVerification() {
    setBusy(true);
    setError("");
    setStatus("qr");
    await wait(450);
    setStatus("face");
    await wait(550);
    setStatus("done");
    await wait(250);
    setBusy(false);
    onVerified({
      ...(citizen || {}),
      first_name: citizen?.first_name || "Lester",
      last_name: citizen?.last_name || "Garingalo",
      birth_date: citizen?.birth_date || "1995-12-02",
      gender: citizen?.gender || "Male",
      mobile_number: citizen?.mobile_number || citizen?.mobile || "+639171234567",
      code: "EVENT-VERIFIED",
    });
  }

  return (
    <Screen
      eyebrow="National ID verification"
      title="Confirm that the citizen and the person present match."
      description="Scan the National ID QR, then complete Face Liveness to confirm the citizen identity."
      aside={<InfoAside icon="id" title="One citizen, one reward" text="National ID e-Verify and Face Liveness help prevent duplicate accounts, impersonation, and repeated reward claims." tags={["e-Verify", "Face Liveness", "Encrypted session"]} />}
    >
      <div className="verification-status-grid">
        <VerificationCard icon="id" number="01" title="National ID e-Verify" text="Validate the QR against the National ID service." state={status === "qr" || status === "face" || status === "done" ? status === "qr" ? "loading" : "done" : "idle"} />
        <VerificationCard icon="user" number="02" title="Face Liveness" text="Use the official camera session to confirm physical presence." state={status === "face" ? "loading" : status === "done" ? "done" : "idle"} />
      </div>

      <div className="verify-method-card">
        <div className="qr-camera-box">
          {cameraOpen ? <video ref={videoRef} muted playsInline aria-label="National ID QR camera" /> : <div><Icon name="camera" size={34} /><strong>National ID QR camera</strong><span>Use the rear camera and hold the QR inside the frame.</span></div>}
        </div>
        <div className="verify-controls">
          <button className="secondary-action" type="button" onClick={cameraOpen ? stopCamera : () => void startQrCamera()}>{cameraOpen ? "Stop camera" : "Open QR camera"}</button>
          <label className="field light-field"><span>QR value</span><div className="field-control"><Icon name="id" size={19} /><textarea value={qrValue} onChange={(event) => setQrValue(event.target.value)} placeholder="Scanned value appears here, or paste it manually" rows={4} /></div></label>
        </div>
      </div>

      {error && <div className="provider-error" role="alert">{error}</div>}

      <div className="action-row stacked-actions">
        <button className="primary-action" disabled={busy} onClick={() => void verifyWithQr()}>
          <span>{busy ? status === "face" ? "Completing Face Liveness…" : "Checking National ID…" : "Verify citizen"}</span><Icon name="arrow" />
        </button>
        <button className="text-action" disabled={busy} onClick={() => void useEventVerification()}>Use event test verification</button>
      </div>
    </Screen>
  );
}

function VerificationCard({ icon, number, title, text, state }: { icon: IconName; number: string; title: string; text: string; state: "idle" | "loading" | "done" }) {
  return <div className={`verification-card ${state}`}><span className="verification-icon"><Icon name={icon} size={25} /></span><small>{number}</small><h3>{title}</h3><p>{text}</p><div className="verification-state">{state === "loading" ? <><i className="spinner" />Checking…</> : state === "done" ? <><Icon name="check" size={16} />Verified</> : "Ready"}</div></div>;
}
function CaptureScreen({ photo, inputRef, onPhoto, onSample, analyzing, onAnalyze }: { photo: string | null; inputRef: React.RefObject<HTMLInputElement | null>; onPhoto: (event: ChangeEvent<HTMLInputElement>) => void; onSample: () => void; analyzing: boolean; onAnalyze: () => void }) {
  return (
    <Screen
      eyebrow="Material capture"
      title="Show us what you’re recycling."
      description="Photograph the recyclable materials you plan to bring. Clear, well-lit images provide a more useful estimate before drop-off."
      aside={<InfoAside icon="camera" title="Capture tips" text="Place materials on a clear surface, keep the full group visible, and avoid heavy shadows or motion blur." tags={["Plastic", "Paper", "Cardboard", "Metal"]} />}
    >
      <input ref={inputRef} hidden type="file" accept="image/*" capture="environment" onChange={onPhoto} />
      {!photo ? (
        <div className="capture-zone" onClick={() => inputRef.current?.click()} role="button" tabIndex={0}>
          <span className="capture-icon"><Icon name="camera" size={34} /></span>
          <h3>Take or upload a photo</h3>
          <p>JPG, PNG or HEIC · Maximum 10 MB</p>
          <button className="outline-action" type="button"><Icon name="upload" size={18} /> Choose image</button>
          <button className="sample-link" type="button" onClick={(event) => { event.stopPropagation(); onSample(); }}>Use prepared recyclable materials</button>
        </div>
      ) : (
        <div className="photo-card">
          {photo === "sample" ? <BottleScene /> : <img src={photo} alt="Selected recyclable materials" />}
          <div className="photo-meta"><span><Icon name="check" size={16} /> Materials ready for analysis</span><button onClick={() => inputRef.current?.click()}>Replace image</button></div>
        </div>
      )}
      <div className="action-row"><button className="primary-action" disabled={!photo || analyzing} onClick={onAnalyze}><span>{analyzing ? "Analyzing materials…" : "Analyze recyclable image"}</span><Icon name="sparkles" /></button></div>
    </Screen>
  );
}

function BottleScene() {
  return (
    <div className="bottle-scene" aria-label="Plastic bottles prepared for recycling">
      <div className="scene-grid" />
      <div className="bottle bottle-one"><i /></div>
      <div className="bottle bottle-two"><i /></div>
      <div className="bottle bottle-three"><i /></div>
      <span className="scan-tag"><Icon name="sparkles" size={15} /> Ready to analyze</span>
    </div>
  );
}

function EstimateScreen({ material, guidance, onContinue }: { material: MaterialResult; guidance: string; onContinue: () => void }) {
  return (
    <Screen
      eyebrow="Image recognition and eGov AI guidance"
      title="Your recyclable estimate is ready."
      description="The image model suggests a material category, while eGov AI provides preparation guidance. The physical measurement determines the final reward."
      aside={<TransactionAside material={material} center="Not selected yet" weight={`${material.estimatedWeight.toFixed(1)} kg estimated`} reward={`${formatMoney(material.estimatedWeight * material.cashRate)} or ${Math.round(material.estimatedWeight * material.pointRate)} points`} />}
    >
      <div className="result-hero"><span><Icon name="recycle" size={31} /></span><div><small>Material identified</small><h3>{material.name}</h3><b>{material.confidence}% recognition confidence</b></div></div>
      <div className="metrics-grid">
        <Metric label="Estimated quantity" value={`${material.quantity} pcs`} />
        <Metric label="Estimated weight" value={`${material.estimatedWeight.toFixed(1)} kg`} />
        <Metric label="Potential cash" value={formatMoney(material.estimatedWeight * material.cashRate)} />
        <Metric label="Potential points" value={`${Math.round(material.estimatedWeight * material.pointRate)}`} />
      </div>
      <div className="ai-guidance"><span><Icon name="sparkles" size={22} /></span><div><small>eGov AI guidance</small><p>{guidance || "Keep materials clean, dry, and separated before drop-off."}</p></div></div>
      <div className="notice"><Icon name="scale" size={20} /><p>The estimate is not the final payout. An accredited collection-center attendant will inspect and weigh the actual materials.</p></div>
      <div className="action-row"><button className="primary-action" onClick={onContinue}><span>Choose a collection center</span><Icon name="arrow" /></button></div>
    </Screen>
  );
}

function CenterScreen({ material, selected, onSelect, onContinue }: { material: MaterialResult; selected: string; onSelect: (id: string) => void; onContinue: () => void }) {
  const center = CENTERS.find((item) => item.id === selected) ?? CENTERS[0];
  return (
    <Screen
      eyebrow="Accredited drop-off"
      title="Choose where to bring your materials."
      description="Select an accredited Barangay MRF or partner junkshop. The attendant will inspect, weigh, and confirm the final reward."
      aside={<TransactionAside material={material} center={center.name} weight={`${material.estimatedWeight.toFixed(1)} kg estimated`} reward={`${formatMoney(material.estimatedWeight * material.cashRate)} estimated`} />}
    >
      <div className="center-list">
        {CENTERS.map((item) => (
          <button key={item.id} className={selected === item.id ? "center-card selected" : "center-card"} onClick={() => onSelect(item.id)}>
            <span className="radio">{selected === item.id && <i />}</span>
            <div className="center-copy"><div className="center-title"><h3>{item.name}</h3><span>{item.distance}</span></div><p>{item.address}</p><div className="center-meta"><span>{item.schedule}</span><span>{item.queue}</span><span>{item.accepts}</span></div></div>
          </button>
        ))}
      </div>
      <div className="action-row"><button className="primary-action" onClick={onContinue}><span>Continue to physical validation</span><Icon name="arrow" /></button></div>
    </Screen>
  );
}

function ValidationScreen({ material, center, weight, setWeight, cash, points, onContinue }: { material: MaterialResult; center: Center; weight: number; setWeight: (value: number) => void; cash: number; points: number; onContinue: () => void }) {
  return (
    <Screen
      eyebrow="Collection-center validation"
      title="Confirm the accepted weight."
      description="The collection-center attendant has inspected the materials. Enter the actual accepted weight to calculate the final reward."
      aside={<TransactionAside material={material} center={center.name} weight={`${weight.toFixed(1)} kg validated`} reward={`${formatMoney(cash)} or ${points} points`} />}
    >
      <div className="validation-banner"><span><Icon name="location" size={25} /></span><div><small>Accredited facility</small><h3>{center.name}</h3><p>{center.address}</p></div><b><Icon name="check" size={15} /> Attendant verified</b></div>
      <div className="validation-grid">
        <label className="weight-card"><span>Actual accepted weight</span><div><input type="number" min="0.1" step="0.1" value={weight} onChange={(event) => setWeight(Number(event.target.value) || 0)} /><strong>kg</strong></div><small>Recorded after inspection and weighing</small></label>
        <div className="accepted-card"><span><Icon name="check" size={24} /></span><div><small>Accepted material</small><h3>{material.name}</h3><p>Clean and recyclable</p></div></div>
      </div>
      <div className="reward-preview"><div><small>Final cash reward</small><strong>{formatMoney(cash)}</strong></div><span>OR</span><div><small>Final Green Points</small><strong>{points} points</strong></div></div>
      <div className="action-row"><button className="primary-action" disabled={weight <= 0} onClick={onContinue}><span>Confirm validated transaction</span><Icon name="arrow" /></button></div>
    </Screen>
  );
}

function RewardScreen({ type, setType, cash, points, onContinue }: { type: RewardType; setType: (value: RewardType) => void; cash: number; points: number; onContinue: () => void }) {
  return (
    <Screen
      eyebrow="Reward selection"
      title="Choose how you want to be rewarded."
      description="Receive the approved amount through a supported payment partner or collect Green Points for participating programs and merchants."
      aside={<InfoAside icon="coins" title="One verified reward" text="The same validated transaction can only be claimed once. Choose the reward that works best for you." tags={["Cash payout", "Green Points"]} />}
    >
      <div className="reward-grid">
        <button className={type === "cash" ? "reward-choice selected" : "reward-choice"} onClick={() => setType("cash")}><span className="choice-icon"><Icon name="wallet" size={29} /></span><span className="radio">{type === "cash" && <i />}</span><small>Cash reward</small><strong>{formatMoney(cash)}</strong><p>Receive funds through GCash, Maya, or a bank account.</p></button>
        <button className={type === "points" ? "reward-choice selected" : "reward-choice"} onClick={() => setType("points")}><span className="choice-icon green"><Icon name="leaf" size={29} /></span><span className="radio">{type === "points" && <i />}</span><small>Green Points</small><strong>{points} points</strong><p>Use points through participating programs and partner merchants.</p></button>
      </div>
      <div className="action-row"><button className="primary-action" onClick={onContinue}><span>Continue with {type === "cash" ? "cash reward" : "Green Points"}</span><Icon name="arrow" /></button></div>
    </Screen>
  );
}

function WalletScreen({ wallet, setWallet, account, setAccount, cash, onContinue }: { wallet: Wallet; setWallet: (value: Wallet) => void; account: string; setAccount: (value: string) => void; cash: number; onContinue: () => void }) {
  const wallets: Array<{ name: Wallet; mark: string; helper: string }> = [
    { name: "GCash", mark: "G", helper: "Mobile wallet" },
    { name: "Maya", mark: "M", helper: "Mobile wallet" },
    { name: "Bank Account", mark: "B", helper: "Supported bank" },
  ];
  return (
    <Screen
      eyebrow="Reward channel"
      title="Select your payment channel."
      description={`Choose where the approved ${formatMoney(cash)} reward should be received. The partner payout flow will generate the claim reference.`}
      aside={<InfoAside icon="wallet" title="Secure reward claim" text="Trash2Cash prepares the validated reward for the selected payment channel without storing the citizen’s wallet balance." tags={["GCash", "Maya", "Bank"]} />}
    >
      <div className="wallet-grid">
        {wallets.map((item) => <button key={item.name} className={wallet === item.name ? "wallet-card selected" : "wallet-card"} onClick={() => setWallet(item.name)}><span className={`wallet-mark ${item.mark.toLowerCase()}`}>{item.mark}</span><div><h3>{item.name}</h3><small>{item.helper}</small></div><span className="radio">{wallet === item.name && <i />}</span></button>)}
      </div>
      <label className="field light-field"><span>{wallet === "Bank Account" ? "Bank account reference" : `${wallet} mobile number`}</span><div className="field-control"><Icon name="wallet" size={19} /><input value={account} onChange={(event) => setAccount(event.target.value)} placeholder={wallet === "Bank Account" ? "Enter account reference" : "09XX XXX XXXX"} /></div></label>
      <div className="process-line"><span>01</span><p>Trash2Cash confirms the validated reward and selected channel.</p><span>02</span><p>{wallet} generates the payment-partner claim reference.</p></div>
      <div className="action-row"><button className="primary-action" disabled={!account.trim()} onClick={onContinue}><span>Generate {wallet} claim QR</span><Icon name="arrow" /></button></div>
    </Screen>
  );
}

function PaymentQrScreen({ material, wallet, cash, transactionId, payload, onContinue }: { material: MaterialResult; wallet: Wallet; cash: number; transactionId: string; payload: string; onContinue: () => void }) {
  return (
    <Screen
      eyebrow="Payment partner"
      title={`${wallet} claim QR is ready.`}
      description="Scan or present this payment-partner QR to complete the reward claim."
      aside={<TransactionAside material={material} center="Validated drop-off" weight={`${material.estimatedWeight.toFixed(1)} kg`} reward={`${formatMoney(cash)} via ${wallet}`} />}
    >
      <div className="qr-section">
        <div className="qr-card"><div className="qr-provider"><span className={`wallet-mark ${wallet === "GCash" ? "g" : wallet === "Maya" ? "m" : "b"}`}>{wallet.charAt(0)}</span><div><h3>{wallet}</h3><small>Payment partner</small></div></div><div className="qr-code"><QRCodeSVG value={payload} size={220} level="M" includeMargin /></div><div className="qr-value"><small>Reward amount</small><strong>{formatMoney(cash)}</strong><span>{transactionId}</span></div></div>
        <div className="claim-steps"><span className="overline">How to claim</span><ol><li><b>01</b><p>Open your selected payment channel.</p></li><li><b>02</b><p>Scan or present the claim QR code.</p></li><li><b>03</b><p>Confirm that the reward was received.</p></li></ol></div>
      </div>
      <div className="action-row"><button className="primary-action" onClick={onContinue}><span>Confirm reward received</span><Icon name="check" /></button></div>
    </Screen>
  );
}

function PointsScreen({ points, onContinue }: { points: number; onContinue: () => void }) {
  return (
    <Screen
      eyebrow="Green Points"
      title="Your verified points are ready."
      description="The points will be credited to your Trash2Cash account and can be used through participating programs and partner merchants."
      aside={<InfoAside icon="leaf" title="Community value" text="Green Points support continued participation while keeping every achievement tied to a verified recycling transaction." tags={["Eco rewards", "Partner offers"]} />}
    >
      <div className="points-hero"><span><Icon name="leaf" size={44} /></span><small>Points to be credited</small><strong>+{points}</strong><p>Updated balance: {1420 + points} Green Points</p></div>
      <div className="redemption-grid"><div><Icon name="coins" /><h3>Government programs</h3><p>Redeem points through participating benefits.</p></div><div><Icon name="wallet" /><h3>Partner merchants</h3><p>Use points through available partner offers.</p></div><div><Icon name="recycle" /><h3>Community rewards</h3><p>Unlock recycling streaks and eco milestones.</p></div></div>
      <div className="action-row"><button className="primary-action" onClick={onContinue}><span>Credit Green Points</span><Icon name="check" /></button></div>
    </Screen>
  );
}

function CompleteScreen({ citizen, material, rewardType, wallet, cash, points, weight, center, transactionId, onRestart }: { citizen: CitizenProfile | null; material: MaterialResult; rewardType: RewardType; wallet: Wallet; cash: number; points: number; weight: number; center: Center; transactionId: string; onRestart: () => void }) {
  const [messageState, setMessageState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [messageText, setMessageText] = useState("");
  const mobile = normalizePhMobile(String(citizen?.mobile_number || citizen?.mobile || ""));

  async function sendConfirmation() {
    if (!mobile) {
      setMessageState("error");
      setMessageText("Add a valid Philippine mobile number to the citizen profile before sending an SMS.");
      return;
    }
    setMessageState("sending");
    setMessageText("");
    try {
      const reward = rewardType === "cash" ? `${formatMoney(cash)} via ${wallet}` : `${points} Green Points`;
      const response = await fetch("/api/emessage/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: mobile, message: `Trash2Cash ${transactionId}: Your ${weight.toFixed(1)} kg recycling transaction at ${center.name} is complete. Reward: ${reward}.` }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "The confirmation SMS could not be sent.");
      setMessageState("sent");
      setMessageText(payload.message || "Confirmation SMS sent through e-Message.");
    } catch (error) {
      setMessageState("error");
      setMessageText(error instanceof Error ? error.message : "The confirmation SMS could not be sent.");
    }
  }

  return (
    <Screen
      eyebrow="Transaction completed"
      title="Your recycling reward has been issued."
      description="The materials were validated and the reward flow was completed. Send the citizen a transaction confirmation through e-Message."
      aside={<InfoAside icon="check" title="Verified completion" text="This transaction is now recorded as completed and cannot be claimed again." tags={[transactionId, "Completed"]} />}
    >
      <div className="complete-banner"><span><Icon name="check" size={36} /></span><div><small>Reward issued</small><h3>{rewardType === "cash" ? `${formatMoney(cash)} through ${wallet}` : `${points} Green Points credited`}</h3><p>Thank you for helping divert recyclable waste from landfill.</p></div></div>
      <div className="receipt"><div className="receipt-head"><span>TRASH2CASH RECEIPT</span><strong>{transactionId}</strong></div><ReceiptLine label="Material" value={material.name} /><ReceiptLine label="Validated weight" value={`${weight.toFixed(1)} kg`} /><ReceiptLine label="Collection center" value={center.name} /><ReceiptLine label="Reward" value={rewardType === "cash" ? `${formatMoney(cash)} · ${wallet}` : `${points} Green Points`} /><ReceiptLine label="Status" value="Completed" /></div>

      <div className="message-panel">
        <div><span className="overline">e-Message</span><h3>Send transaction confirmation</h3><p>{mobile ? `The SMS will be sent to ${mobile}.` : "No valid mobile number is available in the citizen profile."}</p></div>
        <button className="secondary-action" disabled={messageState === "sending" || messageState === "sent"} onClick={() => void sendConfirmation()}>{messageState === "sending" ? "Sending…" : messageState === "sent" ? "Confirmation sent" : "Send SMS"}</button>
      </div>
      {messageText && <div className={messageState === "error" ? "provider-error" : "provider-success"}>{messageText}</div>}

      <div className="action-row"><button className="primary-action" onClick={onRestart}><span>Start another transaction</span><Icon name="recycle" /></button></div>
    </Screen>
  );
}

function ReportModal({ citizen, transactionId, onClose }: { citizen: CitizenProfile | null; transactionId: string; onClose: () => void }) {
  const [reportType, setReportType] = useState("SERVICE_COMPLAINT");
  const [subject, setSubject] = useState(`Trash2Cash concern · ${transactionId}`);
  const [message, setMessage] = useState("");
  const [mobile, setMobile] = useState(normalizePhMobile(String(citizen?.mobile_number || citizen?.mobile || "")) || "+639171234567");
  const [email, setEmail] = useState(citizen?.email || "");
  const [regionCode, setRegionCode] = useState(String(citizen?.region_code || "130000000"));
  const [provinceCode, setProvinceCode] = useState(String(citizen?.province_code || "138000000"));
  const [municipalityCode, setMunicipalityCode] = useState(String(citizen?.municipality_code || "138130000"));
  const [barangayCode, setBarangayCode] = useState(String(citizen?.barangay_code || "138130012"));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function submitReport() {
    if (!message.trim() || !subject.trim() || !email.trim() || !mobile.trim()) {
      setResult({ type: "error", text: "Mobile number, email, subject, and report details are required." });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch("/api/ereport/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile,
          first_name: citizen?.first_name || "Citizen",
          last_name: citizen?.last_name || "User",
          gender: citizen?.gender || "Not specified",
          complainant_email: email,
          report_type: reportType,
          subject,
          message: `${message}\n\nTrash2Cash transaction: ${transactionId}`,
          evidences: [],
          region_code: regionCode,
          province_code: provinceCode,
          municipality_code: municipalityCode,
          barangay_code: barangayCode,
        }),
      });
      const payload = (await response.json()) as { case_number?: string; message?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "eReport could not submit the report.");
      setResult({ type: "success", text: payload.case_number ? `Report submitted. Case number: ${payload.case_number}` : payload.message || "Report submitted successfully." });
    } catch (error) {
      setResult({ type: "error", text: error instanceof Error ? error.message : "eReport could not submit the report." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <section className="report-modal" role="dialog" aria-modal="true" aria-labelledby="report-title">
        <div className="report-modal-head"><div><span className="overline">e-Report</span><h2 id="report-title">Report a Trash2Cash issue</h2></div><button className="modal-close" onClick={onClose} aria-label="Close report form">×</button></div>
        <p>Send service, weighing, payment, facility, or environmental concerns to the government reporting service.</p>
        <div className="report-form-grid">
          <label className="field light-field"><span>Report type</span><div className="field-control"><select value={reportType} onChange={(event) => setReportType(event.target.value)}><option value="SERVICE_COMPLAINT">Service complaint</option><option value="ENVIRONMENTAL_VIOLATION">Environmental violation</option><option value="ILLEGAL_DUMPING">Illegal dumping</option><option value="PAYMENT_CONCERN">Reward concern</option></select></div></label>
          <label className="field light-field"><span>Mobile number</span><div className="field-control"><input value={mobile} onChange={(event) => setMobile(event.target.value)} /></div></label>
          <label className="field light-field"><span>Email address</span><div className="field-control"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div></label>
          <label className="field light-field span-two"><span>Subject</span><div className="field-control"><input value={subject} onChange={(event) => setSubject(event.target.value)} /></div></label>
          <label className="field light-field span-two"><span>Report details</span><div className="field-control"><textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={5} placeholder="Explain what happened, where it happened, and the outcome you need." /></div></label>
        </div>
        <details className="location-codes"><summary>Location codes</summary><div className="report-form-grid"><label><span>Region</span><input value={regionCode} onChange={(event) => setRegionCode(event.target.value)} /></label><label><span>Province</span><input value={provinceCode} onChange={(event) => setProvinceCode(event.target.value)} /></label><label><span>Municipality</span><input value={municipalityCode} onChange={(event) => setMunicipalityCode(event.target.value)} /></label><label><span>Barangay</span><input value={barangayCode} onChange={(event) => setBarangayCode(event.target.value)} /></label></div></details>
        {result && <div className={result.type === "error" ? "provider-error" : "provider-success"}>{result.text}</div>}
        <div className="modal-actions"><button className="secondary-action" onClick={onClose}>Close</button><button className="primary-action" disabled={busy || result?.type === "success"} onClick={() => void submitReport()}><span>{busy ? "Submitting…" : "Submit through e-Report"}</span><Icon name="arrow" /></button></div>
      </section>
    </div>
  );
}

function normalizePhMobile(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("63") && digits.length >= 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+63${digits.slice(1)}`;
  if (digits.startsWith("9") && digits.length === 10) return `+63${digits}`;
  return value.startsWith("+") ? value : "";
}
function InfoAside({ icon, title, text, tags }: { icon: IconName; title: string; text: string; tags: string[] }) {
  return (
    <div className="aside-card dark-card"><span className="aside-icon"><Icon name={icon} size={27} /></span><span className="overline light">Transaction support</span><h2>{title}</h2><p>{text}</p><div className="tag-list">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
  );
}

function TransactionAside({ material, center, weight, reward }: { material: MaterialResult; center: string; weight: string; reward: string }) {
  return (
    <div className="aside-card summary-card"><span className="overline">Current transaction</span><h2>Recycling summary</h2><div className="summary-material"><span><Icon name="recycle" size={23} /></span><div><strong>{material.name}</strong><small>{material.quantity} estimated pieces</small></div></div><ReceiptLine label="Collection center" value={center} /><ReceiptLine label="Weight" value={weight} /><ReceiptLine label="Reward" value={reward} /></div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><small>{label}</small><strong>{value}</strong></div>;
}

function ReceiptLine({ label, value }: { label: string; value: string }) {
  return <div className="receipt-line"><span>{label}</span><strong>{value}</strong></div>;
}
