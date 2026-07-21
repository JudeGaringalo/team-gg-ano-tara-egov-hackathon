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

type Step =
  | "login"
  | "verify"
  | "dashboard"
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
  | "wallet"
  | "tree"
  | "activity";

type Center = {
  id: string;
  name: string;
  address: string;
  distance: string;
  schedule: string;
  queue: string;
  accepts: string;
};

type Activity = {
  id: string;
  date: string;
  material: string;
  weight: string;
  reward: string;
  type: "cash" | "points";
  center: string;
};

const RECENT_ACTIVITIES: Activity[] = [
  {
    id: "T2C-88A912",
    date: "Yesterday, 3:45 PM",
    material: "PET Plastic Bottles",
    weight: "2.4 kg",
    reward: "₱72.00",
    type: "cash",
    center: "Barangay Central MRF",
  },
  {
    id: "T2C-77B401",
    date: "Jul 18, 2026",
    material: "Aluminum Cans",
    weight: "1.2 kg",
    reward: "+120 pts",
    type: "points",
    center: "GreenCycle Partner Junkshop",
  },
  {
    id: "T2C-65C109",
    date: "Jul 12, 2026",
    material: "Cardboard & Paper",
    weight: "5.0 kg",
    reward: "₱50.00",
    type: "cash",
    center: "City Materials Recovery Facility",
  },
];

const MATERIAL = {
  name: "PET Plastic Bottles",
  quantity: 12,
  estimatedWeight: 1.5,
  cashRate: 30,
  pointRate: 100,
};

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
  { key: "dashboard", label: "Dashboard" },
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
    eye: <><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6Z"/><circle cx="12" cy="12" r="2.8"/></>,
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
    tree: <><path d="M12 19v3"/><path d="M12 19c-3.5 0-6-2.5-6-6 0-2 1-3.5 2.5-4.5C8 7 9.5 5 12 5s4 2 3.5 3.5C17 9.5 18 11 18 13c0 3.5-2.5 6-6 6Z"/></>,
    activity: <><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></>,
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
  const [email, setEmail] = useState("lesterjudeag@gmail.com");
  const [password, setPassword] = useState("trash2cash");
  const [showPassword, setShowPassword] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [verificationStage, setVerificationStage] = useState<"idle" | "id" | "face" | "done">("idle");
  const [photo, setPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState(CENTERS[0].id);
  const [actualWeight, setActualWeight] = useState(1.5);
  const [rewardType, setRewardType] = useState<RewardType>("cash");
  const [wallet, setWallet] = useState<Wallet>("GCash");
  const [account, setAccount] = useState("0917 123 4567");
  const [toast, setToast] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCenterData = CENTERS.find((center) => center.id === selectedCenter) ?? CENTERS[0];
  const finalCash = actualWeight * MATERIAL.cashRate;
  const finalPoints = Math.round(actualWeight * MATERIAL.pointRate);
  const transactionId = "T2C-A7F392";
  const qrPayload = JSON.stringify({ transactionId, wallet, amount: finalCash.toFixed(2), currency: "PHP" });

  const normalizedStep = step === "paymentQr" || step === "points" ? "wallet" : step;
  const activeIndex = useMemo(() => FLOW_STEPS.findIndex((item) => item.key === normalizedStep), [normalizedStep]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2800);
  }

  async function submitLogin() {
    if (!email.trim() || !password.trim()) return;
    setLoginBusy(true);
    await wait(700);
    setLoginBusy(false);
    setStep("verify");
    notify("Secure citizen session started");
  }

  async function verifyIdentity() {
    setVerificationStage("id");
    await wait(700);
    setVerificationStage("face");
    await wait(850);
    setVerificationStage("done");
    notify("Identity verified successfully");
    await wait(350);
    setStep("dashboard");
  }

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setPhoto(URL.createObjectURL(file));
  }

  function useSamplePhoto() {
    setPhoto("sample");
    notify("Recyclable materials added");
  }

  async function analyzePhoto() {
    setAnalyzing(true);
    await wait(1050);
    setAnalyzing(false);
    setStep("estimate");
    notify("Material analysis completed");
  }

  function logout() {
    setStep("login");
    setVerificationStage("idle");
    setPhoto(null);
    setActualWeight(1.5);
    setRewardType("cash");
    setWallet("GCash");
  }

  function restart() {
    setPhoto(null);
    setActualWeight(1.5);
    setRewardType("cash");
    setWallet("GCash");
    setStep("dashboard");
  }

  function goBack() {
    const previous: Partial<Record<Step, Step>> = {
      verify: "login",
      dashboard: "verify",
      capture: "dashboard",
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
              <span className="orbit-label label-one">AI estimate</span>
              <span className="orbit-label label-two">Verified drop-off</span>
              <span className="orbit-label label-three">Secure reward</span>
            </div>
            <div className="story-footer">
              <span>National ID e-Verify</span>
              <span>Face Liveness</span>
              <span>eGov AI</span>
              <span>eGov Pay</span>
            </div>
          </section>

          <section className="login-panel-wrap">
            <div className="login-panel">
              <span className="panel-number">01 / Citizen access</span>
              <h2>Welcome to Trash2Cash</h2>
              <p>Sign in to begin a verified recycling transaction.</p>

              <label className="field">
                <span>Email address</span>
                <div className="field-control"><Icon name="user" size={19} /><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@email.com" /></div>
              </label>

              <label className="field">
                <span>Password</span>
                <div className="field-control">
                  <Icon name="lock" size={19} />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    className="field-button"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    <Icon name="eye" size={18} />
                  </button>
                </div>
              </label>

              <button className="primary-action login-action" disabled={!email.trim() || !password.trim() || loginBusy} onClick={submitLogin}>
                <span>{loginBusy ? "Signing in…" : "Continue securely"}</span><Icon name="arrow" />
              </button>

              <div className="login-note"><Icon name="lock" size={16} /><p>Your identity will be confirmed using National ID e-Verify and Face Liveness before a transaction can begin.</p></div>
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
        <button className="account-button" onClick={logout}><span>LG</span><div><strong>Lester</strong><small>Verified citizen</small></div><Icon name="logout" size={18} /></button>
      </header>

      <ProgressBar activeIndex={activeIndex} />

      <main className="workspace">
        <div className="workspace-heading">
          <button className="back-button" onClick={goBack}><Icon name="back" size={18} /> Back</button>
          <span>{Math.max(activeIndex + 1, 1).toString().padStart(2, "0")} / 09</span>
        </div>

        {step === "verify" && <VerifyScreen stage={verificationStage} onVerify={verifyIdentity} />}
        {step === "dashboard" && <DashboardScreen onStartScan={() => setStep("capture")} />}
        {step === "capture" && <CaptureScreen photo={photo} inputRef={inputRef} onPhoto={handlePhoto} onSample={useSamplePhoto} analyzing={analyzing} onAnalyze={analyzePhoto} />}
        {step === "estimate" && <EstimateScreen onContinue={() => setStep("center")} />}
        {step === "center" && <CenterScreen selected={selectedCenter} onSelect={setSelectedCenter} onContinue={() => setStep("validation")} />}
        {step === "validation" && <ValidationScreen center={selectedCenterData} weight={actualWeight} setWeight={setActualWeight} cash={finalCash} points={finalPoints} onContinue={() => setStep("reward")} />}
        {step === "reward" && <RewardScreen type={rewardType} setType={setRewardType} cash={finalCash} points={finalPoints} onContinue={() => setStep(rewardType === "cash" ? "wallet" : "points")} />}
        {step === "wallet" && <WalletScreen wallet={wallet} setWallet={setWallet} account={account} setAccount={setAccount} cash={finalCash} onContinue={() => setStep("paymentQr")} />}
        {step === "paymentQr" && <PaymentQrScreen wallet={wallet} cash={finalCash} transactionId={transactionId} payload={qrPayload} onContinue={() => setStep("complete")} />}
        {step === "points" && <PointsScreen points={finalPoints} onContinue={() => setStep("complete")} />}
        {step === "complete" && <CompleteScreen rewardType={rewardType} wallet={wallet} cash={finalCash} points={finalPoints} weight={actualWeight} center={selectedCenterData} transactionId={transactionId} onRestart={restart} />}
      </main>

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

function VerifyScreen({ stage, onVerify }: { stage: "idle" | "id" | "face" | "done"; onVerify: () => void }) {
  const idDone = stage === "face" || stage === "done";
  const faceDone = stage === "done";
  return (
    <Screen
      eyebrow="Secure citizen verification"
      title="Confirm that it’s really you."
      description="Trash2Cash uses your verified citizen identity to prevent duplicate accounts, fraudulent reward claims, and transaction disputes."
      aside={<InfoAside icon="lock" title="Why verification matters" text="Only verified citizens can submit and receive recycling rewards. Your identity is used only for the transaction record." tags={["National ID e-Verify", "Face Liveness"]} />}
    >
      <div className="verification-list">
        <VerificationCard icon="id" number="01" title="National ID e-Verify" text="Authenticate your citizen identity using your National ID record." state={stage === "id" ? "loading" : idDone ? "done" : "idle"} />
        <VerificationCard icon="eye" number="02" title="Face Liveness" text="Confirm that you are physically present and prevent spoofed submissions." state={stage === "face" ? "loading" : faceDone ? "done" : "idle"} />
      </div>
      <div className="action-row"><button className="primary-action" onClick={onVerify} disabled={stage !== "idle" && stage !== "done"}><span>{stage === "idle" ? "Verify my identity" : stage === "done" ? "Identity verified" : "Verification in progress…"}</span><Icon name={stage === "done" ? "check" : "arrow"} /></button></div>
    </Screen>
  );
}

function VerificationCard({ icon, number, title, text, state }: { icon: IconName; number: string; title: string; text: string; state: "idle" | "loading" | "done" }) {
  return (
    <div className={state === "loading" ? "verification-card loading" : state === "done" ? "verification-card complete" : "verification-card"}>
      <span className="card-icon"><Icon name={icon} size={27} /></span>
      <div><small>{number}</small><h3>{title}</h3><p>{text}</p></div>
      <span className="verification-status">{state === "loading" ? "Checking…" : state === "done" ? <Icon name="check" size={17} /> : "Ready"}</span>
    </div>
  );
}

function DashboardScreen({ onStartScan }: { onStartScan: () => void }) {
  return (
    <Screen
      eyebrow="Citizen Dashboard"
      title="Welcome back, Lester."
      description="Track your earned rewards, total environmental impact, and view recent recycling activities before starting a new drop-off scan."
      aside={
        <InfoAside
          icon="sparkles"
          title="Ready to recycle?"
          text="Snap a clear photo of your materials. Our AI will automatically estimate the quantity, weight, and reward value."
          tags={["Instant AI Estimate", "Accredited Centers"]}
        />
      }
    >
      <div className="metrics-grid dashboard-metrics">
        <div className="metric highlight-metric green-metric">
          <span className="metric-icon"><Icon name="leaf" size={20} /></span>
          <small>Eco Points Balance</small>
          <strong>1,420 <span className="unit">pts</span></strong>
        </div>
        <div className="metric highlight-metric">
          <span className="metric-icon"><Icon name="wallet" size={20} /></span>
          <small>Cash Earned</small>
          <strong>{formatMoney(480.00)}</strong>
        </div>
        <div className="metric">
          <span className="metric-icon"><Icon name="recycle" size={20} /></span>
          <small>Plastic Saved</small>
          <strong>18.6 <span className="unit">kg</span></strong>
        </div>
        <div className="metric">
          <span className="metric-icon"><Icon name="tree" size={20} /></span>
          <small>Trees Saved</small>
          <strong>4 <span className="unit">trees</span></strong>
        </div>
      </div>

      <div className="action-banner">
        <div className="banner-copy">
          <h3>Have recyclable materials ready?</h3>
          <p>Scan your items now to get an instant AI estimate and drop off at an accredited center.</p>
        </div>
        <button className="primary-action" onClick={onStartScan}>
          <span>Scan Recyclables Now</span>
          <Icon name="camera" />
        </button>
      </div>

      <div className="recent-activity-section">
        <div className="section-head">
          <h3><Icon name="activity" size={20} /> Recent Activities</h3>
          <span className="activity-count">{RECENT_ACTIVITIES.length} transactions</span>
        </div>
        <div className="activity-list">
          {RECENT_ACTIVITIES.map((act) => (
            <div className="activity-card" key={act.id}>
              <div className="activity-main">
                <span className={`activity-badge ${act.type}`}>
                  <Icon name={act.type === "cash" ? "wallet" : "leaf"} size={16} />
                </span>
                <div>
                  <h4>{act.material}</h4>
                  <small>{act.center} · {act.date}</small>
                </div>
              </div>
              <div className="activity-side">
                <strong>{act.reward}</strong>
                <small>{act.weight}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
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
      <div className="action-row"><button className="primary-action" disabled={!photo || analyzing} onClick={onAnalyze}><span>{analyzing ? "Analyzing materials…" : "Analyze with eGov AI"}</span><Icon name="sparkles" /></button></div>
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

function EstimateScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <Screen
      eyebrow="eGov AI estimate"
      title="Your recyclable estimate is ready."
      description="This result helps you understand the likely material value before visiting a collection center. The physical measurement will determine the final reward."
      aside={<TransactionAside center="Not selected yet" weight={`${MATERIAL.estimatedWeight.toFixed(1)} kg estimated`} reward={`${formatMoney(MATERIAL.estimatedWeight * MATERIAL.cashRate)} or ${MATERIAL.estimatedWeight * MATERIAL.pointRate} points`} />}
    >
      <div className="result-hero"><span><Icon name="recycle" size={31} /></span><div><small>Material identified</small><h3>{MATERIAL.name}</h3><b>96% recognition confidence</b></div></div>
      <div className="metrics-grid">
        <Metric label="Estimated quantity" value={`${MATERIAL.quantity} pcs`} />
        <Metric label="Estimated weight" value={`${MATERIAL.estimatedWeight.toFixed(1)} kg`} />
        <Metric label="Potential cash" value={formatMoney(MATERIAL.estimatedWeight * MATERIAL.cashRate)} />
        <Metric label="Potential points" value={`${MATERIAL.estimatedWeight * MATERIAL.pointRate}`} />
      </div>
      <div className="notice"><Icon name="scale" size={20} /><p>The estimate is not the final payout. An accredited collection-center attendant will inspect and weigh the actual materials.</p></div>
      <div className="action-row"><button className="primary-action" onClick={onContinue}><span>Choose a collection center</span><Icon name="arrow" /></button></div>
    </Screen>
  );
}

function CenterScreen({ selected, onSelect, onContinue }: { selected: string; onSelect: (id: string) => void; onContinue: () => void }) {
  const center = CENTERS.find((item) => item.id === selected) ?? CENTERS[0];
  return (
    <Screen
      eyebrow="Accredited drop-off"
      title="Choose where to bring your materials."
      description="Select an accredited Barangay MRF or partner junkshop. The attendant will inspect, weigh, and confirm the final reward."
      aside={<TransactionAside center={center.name} weight={`${MATERIAL.estimatedWeight.toFixed(1)} kg estimated`} reward={`${formatMoney(MATERIAL.estimatedWeight * MATERIAL.cashRate)} estimated`} />}
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

function ValidationScreen({ center, weight, setWeight, cash, points, onContinue }: { center: Center; weight: number; setWeight: (value: number) => void; cash: number; points: number; onContinue: () => void }) {
  return (
    <Screen
      eyebrow="Collection-center validation"
      title="Confirm the accepted weight."
      description="The collection-center attendant has inspected the materials. Enter the actual accepted weight to calculate the final reward."
      aside={<TransactionAside center={center.name} weight={`${weight.toFixed(1)} kg validated`} reward={`${formatMoney(cash)} or ${points} points`} />}
    >
      <div className="validation-banner"><span><Icon name="location" size={25} /></span><div><small>Accredited facility</small><h3>{center.name}</h3><p>{center.address}</p></div><b><Icon name="check" size={15} /> Attendant verified</b></div>
      <div className="validation-grid">
        <label className="weight-card"><span>Actual accepted weight</span><div><input type="number" min="0.1" step="0.1" value={weight} onChange={(event) => setWeight(Number(event.target.value) || 0)} /><strong>kg</strong></div><small>Recorded after inspection and weighing</small></label>
        <div className="accepted-card"><span><Icon name="check" size={24} /></span><div><small>Accepted material</small><h3>{MATERIAL.name}</h3><p>Clean and recyclable</p></div></div>
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
      eyebrow="eGov Pay"
      title="Select your payment channel."
      description={`Choose where the approved ${formatMoney(cash)} reward should be sent. The payment partner will generate the claim QR.`}
      aside={<InfoAside icon="wallet" title="Secure disbursement" text="eGov Pay sends the approved reward request to your selected payment partner. Trash2Cash does not store your wallet balance." tags={["GCash", "Maya", "Bank"]} />}
    >
      <div className="wallet-grid">
        {wallets.map((item) => <button key={item.name} className={wallet === item.name ? "wallet-card selected" : "wallet-card"} onClick={() => setWallet(item.name)}><span className={`wallet-mark ${item.mark.toLowerCase()}`}>{item.mark}</span><div><h3>{item.name}</h3><small>{item.helper}</small></div><span className="radio">{wallet === item.name && <i />}</span></button>)}
      </div>
      <label className="field light-field"><span>{wallet === "Bank Account" ? "Bank account reference" : `${wallet} mobile number`}</span><div className="field-control"><Icon name="wallet" size={19} /><input value={account} onChange={(event) => setAccount(event.target.value)} placeholder={wallet === "Bank Account" ? "Enter account reference" : "09XX XXX XXXX"} /></div></label>
      <div className="process-line"><span>01</span><p>Trash2Cash submits the validated reward through eGov Pay.</p><span>02</span><p>{wallet} generates the payment or claim QR.</p></div>
      <div className="action-row"><button className="primary-action" disabled={!account.trim()} onClick={onContinue}><span>Generate {wallet} claim QR</span><Icon name="arrow" /></button></div>
    </Screen>
  );
}

function PaymentQrScreen({ wallet, cash, transactionId, payload, onContinue }: { wallet: Wallet; cash: number; transactionId: string; payload: string; onContinue: () => void }) {
  return (
    <Screen
      eyebrow="Payment partner"
      title={`${wallet} claim QR is ready.`}
      description="Scan or present this payment-partner QR to complete the reward claim."
      aside={<TransactionAside center="Validated drop-off" weight={`${MATERIAL.estimatedWeight.toFixed(1)} kg`} reward={`${formatMoney(cash)} via ${wallet}`} />}
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

function CompleteScreen({ rewardType, wallet, cash, points, weight, center, transactionId, onRestart }: { rewardType: RewardType; wallet: Wallet; cash: number; points: number; weight: number; center: Center; transactionId: string; onRestart: () => void }) {
  return (
    <Screen
      eyebrow="Transaction completed"
      title="Your recycling reward has been issued."
      description="The materials were validated, the reward was completed, and a transaction confirmation was sent through e-Message."
      aside={<InfoAside icon="check" title="Verified completion" text="This transaction is now recorded as completed and cannot be claimed again." tags={[transactionId, "Completed"]} />}
    >
      <div className="complete-banner"><span><Icon name="check" size={36} /></span><div><small>Reward issued</small><h3>{rewardType === "cash" ? `${formatMoney(cash)} through ${wallet}` : `${points} Green Points credited`}</h3><p>Thank you for helping divert recyclable waste from landfill.</p></div></div>
      <div className="receipt"><div className="receipt-head"><span>TRASH2CASH RECEIPT</span><strong>{transactionId}</strong></div><ReceiptLine label="Material" value={MATERIAL.name} /><ReceiptLine label="Validated weight" value={`${weight.toFixed(1)} kg`} /><ReceiptLine label="Collection center" value={center.name} /><ReceiptLine label="Reward" value={rewardType === "cash" ? `${formatMoney(cash)} · ${wallet}` : `${points} Green Points`} /><ReceiptLine label="Status" value="Completed" /></div>
      <div className="action-row"><button className="primary-action" onClick={onRestart}><span>Start another transaction</span><Icon name="recycle" /></button></div>
    </Screen>
  );
}

function InfoAside({ icon, title, text, tags }: { icon: IconName; title: string; text: string; tags: string[] }) {
  return (
    <div className="aside-card dark-card"><span className="aside-icon"><Icon name={icon} size={27} /></span><span className="overline light">Transaction support</span><h2>{title}</h2><p>{text}</p><div className="tag-list">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
  );
}

function TransactionAside({ center, weight, reward }: { center: string; weight: string; reward: string }) {
  return (
    <div className="aside-card summary-card"><span className="overline">Current transaction</span><h2>Recycling summary</h2><div className="summary-material"><span><Icon name="recycle" size={23} /></span><div><strong>{MATERIAL.name}</strong><small>{MATERIAL.quantity} estimated pieces</small></div></div><ReceiptLine label="Collection center" value={center} /><ReceiptLine label="Weight" value={weight} /><ReceiptLine label="Reward" value={reward} /></div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><small>{label}</small><strong>{value}</strong></div>;
}

function ReceiptLine({ label, value }: { label: string; value: string }) {
  return <div className="receipt-line"><span>{label}</span><strong>{value}</strong></div>;
}