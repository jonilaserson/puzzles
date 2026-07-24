const { useState, useEffect, useMemo, useRef, useCallback, Fragment } = React;

/* The disc-doubling proof. Rule: move discs onto a pole only if it doubles.
   Round: with piles a<=b<=c, write q=floor(b/a) in binary and double the
   smallest pile bit by bit, drawing from b on 1-bits, from c on 0-bits.
   Live invariant on the donor:  b = a*q + r.  Each doubling halves q (shift
   right) and doubles a, while r stays fixed; the bit shifted off says who paid. */

// --- inline icons (replacing lucide-react) ---
const icon = (size, paths) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{paths}</svg>
);
const Play = ({ size = 16 }) => icon(size, <polygon points="6 4 20 12 6 20 6 4" fill="currentColor" stroke="none" />);
const Pause = ({ size = 16 }) => icon(size, <><rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" /><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" /></>);
const SkipForward = ({ size = 16 }) => icon(size, <><polygon points="5 4 15 12 5 20 5 4" fill="currentColor" stroke="none" /><line x1="19" y1="5" x2="19" y2="19" /></>);
const SkipBack = ({ size = 16 }) => icon(size, <><polygon points="19 4 9 12 19 20 19 4" fill="currentColor" stroke="none" /><line x1="5" y1="5" x2="5" y2="19" /></>);
const RotateCcw = ({ size = 16 }) => icon(size, <><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></>);
const Dices = ({ size = 15 }) => icon(size, <><rect x="2" y="10" width="12" height="12" rx="2" /><circle cx="6" cy="14" r=".5" fill="currentColor" /><circle cx="10" cy="18" r=".5" fill="currentColor" /><path d="M10 2h10a2 2 0 0 1 2 2v10" /><circle cx="14" cy="6" r=".5" fill="currentColor" /><circle cx="18" cy="10" r=".5" fill="currentColor" /></>);

const COLORS = [
  { ink: "#AE3B2E", name: "I" },
  { ink: "#2E7D86", name: "II" },
  { ink: "#C28A33", name: "III" },
];
const PRESETS = [[1, 5, 6], [3, 14, 16], [3, 7, 11], [2, 9, 12]];

function generatePlan(initial) {
  let p = [...initial];
  const moves = [], rounds = [];
  let guard = 0;
  if (p.some((v) => v <= 0)) return { moves, rounds };
  while (!p.some((v) => v === 0) && guard < 400) {
    guard++;
    const [A, B, C] = [0, 1, 2].sort((x, y) => p[x] - p[y] || x - y);
    const a = p[A], b = p[B], c = p[C];
    const q = Math.floor(b / a), r = b % a;
    const bits = [];
    let qq = q;
    while (qq > 0) { bits.push(qq & 1); qq >>= 1; }
    if (!bits.length) break;
    rounds.push({ A, B, C, a, b, c, q, r, bits, moveStart: moves.length, startMin: a });
    for (let i = 0; i < bits.length; i++) {
      const amount = a * 2 ** i, donor = bits[i] ? B : C;
      moves.push({ from: donor, to: A, amount, roundIndex: rounds.length - 1 });
      p[donor] -= amount; p[A] += amount;
    }
  }
  return { moves, rounds };
}

function shade(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * 0.74);
  const g = Math.round(((n >> 8) & 255) * 0.74);
  const b = Math.round((n & 255) * 0.74);
  return `rgb(${r},${g},${b})`;
}

function App() {
  const [initial, setInitial] = useState([3, 14, 16]);
  const [mode, setMode] = useState("manual");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [piles, setPiles] = useState([3, 14, 16]);
  const [fly, setFly] = useState(null);
  const [sel, setSel] = useState(null);
  const [shake, setShake] = useState(null);

  const plan = useMemo(() => generatePlan(initial), [initial]);
  const total = initial.reduce((s, v) => s + v, 0);
  const flyKey = useRef(0), contRef = useRef(null), poleRefs = useRef([]);

  const pilesAtStep = useCallback((s) => {
    const p = [...initial];
    const lim = Math.min(s, plan.moves.length);
    for (let k = 0; k < lim; k++) { const m = plan.moves[k]; p[m.from] -= m.amount; p[m.to] += m.amount; }
    return p;
  }, [initial, plan]);

  useEffect(() => { setStep(0); setPlaying(false); setSel(null); setPiles([...initial]); }, [initial, mode]);
  useEffect(() => { if (mode === "auto") setPiles(pilesAtStep(step)); }, [step, mode, pilesAtStep]);

  // the formal-proof <details> lives outside the app; keep it proof-mode only
  useEffect(() => {
    const el = document.querySelector(".formal");
    if (el) el.style.display = mode === "auto" ? "" : "none";
  }, [mode]);

  // slower, readable pacing
  const gap = { 1: 1700, 2: 1150, 3: 700, 4: 380 }[speed];
  const FLIGHT = Math.min(gap + 150, 1050);

  const triggerFly = useCallback((from, to, amount) => {
    const cont = contRef.current, a = poleRefs.current[from], b = poleRefs.current[to];
    if (!cont || !a || !b) return;
    const cr = cont.getBoundingClientRect(), ar = a.getBoundingClientRect(), br = b.getBoundingClientRect();
    const bw = 58;
    const x0 = ar.left - cr.left + ar.width / 2 - bw / 2;
    const x1 = br.left - cr.left + br.width / 2 - bw / 2;
    const y0 = ar.top - cr.top + 60, y1 = br.top - cr.top + 60;
    flyKey.current += 1;
    setFly({ key: flyKey.current, x0, y0, x1, y1, xm: (x0 + x1) / 2, ym: Math.min(y0, y1) - 70, amount, color: COLORS[to].ink, dur: FLIGHT });
  }, [FLIGHT]);

  const forward = useCallback(() => {
    if (mode !== "auto" || step >= plan.moves.length) return;
    const m = plan.moves[step];
    triggerFly(m.from, m.to, m.amount);
    setStep((s) => s + 1);
  }, [mode, step, plan, triggerFly]);

  const back = useCallback(() => { if (mode === "auto") { setPlaying(false); setStep((s) => Math.max(0, s - 1)); } }, [mode]);
  const reset = useCallback(() => { setPlaying(false); setStep(0); setSel(null); setPiles([...initial]); setFly(null); }, [initial]);

  useEffect(() => {
    if (!playing || mode !== "auto") return;
    if (step >= plan.moves.length) { setPlaying(false); return; }
    const id = setTimeout(forward, gap);
    return () => clearTimeout(id);
  }, [playing, step, gap, mode, plan, forward]);

  const solved = piles.some((v) => v === 0);

  const safeStep = Math.min(step, plan.moves.length);

  const handlePoleClick = (i) => {
    if (mode !== "manual" || solved) return;
    if (sel === null) { setSel(i); return; }
    if (sel === i) { setSel(null); return; }
    const receiver = sel, donor = i, amount = piles[receiver];
    if (piles[donor] >= amount && amount > 0) {
      triggerFly(donor, receiver, amount);
      setPiles((p) => { const n = [...p]; n[donor] -= amount; n[receiver] += amount; return n; });
      setSel(null);
    } else { setShake(donor); setTimeout(() => setShake(null), 420); setSel(null); }
  };

  const editPile = (i, dv) => setInitial((arr) => { const n = [...arr]; n[i] = Math.max(0, Math.min(40, n[i] + dv)); return n; });
  const randomize = () => { const r = () => 1 + Math.floor(Math.random() * 11); setInitial([r(), r(), r()]); };

  const activeRoundIdx = safeStep < plan.moves.length ? plan.moves[safeStep].roundIndex : Math.max(0, plan.rounds.length - 1);
  const round = mode === "auto" ? plan.rounds[Math.min(activeRoundIdx, plan.rounds.length - 1)] : null;

  // live state of the current round
  const consumed = round ? Math.max(0, Math.min(round.bits.length, safeStep - round.moveStart)) : 0;
  const aCur = round ? round.a * 2 ** consumed : 0;
  const remainBits = round ? round.bits.slice(consumed).reverse() : [];
  const droppedBits = round ? round.bits.slice(0, consumed) : [];

  const POLE_H = 280;
  const t = Math.max(4, Math.min(17, (POLE_H - 14) / Math.max(2, total)));
  const dgap = total > 22 ? 1 : 2.5;

  return (
    <div className="dd-root">
      <style>{CSS}</style>

      <header className="dd-head">
        <h1 className="dd-title">Emptying a Pole</h1>
        <p className="dd-rule">move discs onto a pole only if it <em>doubles</em></p>
        <p className="dd-sub">
          Three poles hold discs — say 3, 14 and 16. You may move discs from one pole to
          another, but only in the exact amount that <b>doubles the receiving pole</b>: a pole
          holding 5 discs can only receive exactly 5 more. <b>Show that from any starting
          position you can empty one of the poles.</b> Try it below in <em>Play</em> mode —
          then let <em>Proof</em> mode show you a strategy that never fails.
        </p>
      </header>

      <section className="dd-config">
        <button className="dd-chip dd-shuffle" onClick={randomize} title="Shuffle"><Dices size={15} /> shuffle</button>
        {PRESETS.map((p, k) => (
          <button key={k} className="dd-chip" onClick={() => setInitial(p)}>{p.join("·")}</button>
        ))}
        <span className="dd-divider" />
        <div className="dd-modeswitch">
          <button className={mode === "manual" ? "on" : ""} onClick={() => setMode("manual")}>Play</button>
          <button className={mode === "auto" ? "on" : ""} onClick={() => setMode("auto")}>Proof</button>
        </div>
      </section>

      <div className="dd-poles" ref={contRef}>
        {piles.map((count, i) => {
          const isMin = round && i === round.A;
          const isDonorB = round && i === round.B;
          const band = isDonorB ? aCur : null;
          const remStart = isDonorB ? count - round.r : -1;
          return (
            <div
              key={i}
              className={"dd-pole" + (sel === i ? " sel" : "") + (shake === i ? " shake" : "") + (mode === "manual" ? " clickable" : "")}
              ref={(el) => { poleRefs.current[i] = el; }}
              onClick={() => handlePoleClick(i)}
            >
              {isDonorB && (
                <div className="dd-decomp" style={{ "--c": COLORS[i].ink }}>
                  <div className="dd-decomp-row">
                    <span className="dd-eq" style={{ color: COLORS[round.B].ink }}>{count}</span>
                    <span className="dd-op">=</span>
                    <span className="dd-eq" style={{ color: COLORS[round.A].ink }}>{aCur}</span>
                    <span className="dd-op">·</span>
                    <span className="dd-bits">
                      {remainBits.length
                        ? remainBits.map((bt, j) => <span key={"r" + j} className="bit" data-b={bt}>{bt}</span>)
                        : <span className="bit" data-b={0}>0</span>}
                      {droppedBits.length > 0 && <span className="shiftmark">›</span>}
                      {droppedBits.map((bt, j) => (
                        <span
                          key={"d" + j}
                          className={"drop" + (j === droppedBits.length - 1 ? " new" : "")}
                          title={bt ? "paid by " + COLORS[round.B].name : "paid by " + COLORS[round.C].name}
                          style={bt
                            ? { background: COLORS[round.B].ink, color: "var(--paper)", borderColor: COLORS[round.B].ink }
                            : { color: COLORS[round.C].ink, borderColor: COLORS[round.C].ink }}
                        >{bt}</span>
                      ))}
                    </span>
                    <span className="dd-op">+</span>
                    <span className="dd-rem-eq">{round.r}</span>
                  </div>
                  <div className="dd-decomp-tip" />
                </div>
              )}

              <div className="dd-count" style={{ color: COLORS[i].ink }}>
                {count}
                {isMin && !solved && <span className="dd-tag">×2 ↑</span>}
              </div>

              <div className="dd-stack" style={{ height: POLE_H }}>
                <div className="dd-rod" />
                <div className="dd-discs">
                  {Array.from({ length: count }).map((_, d) => {
                    const isRem = isDonorB && d >= remStart;
                    const blk = band ? Math.floor(d / band) : 0;
                    const bandTint = band && !isRem && blk % 2 === 1;
                    const isEdge = band && d !== 0 && d % band === 0;
                    return (
                      <div
                        key={d}
                        className={"dd-disc" + (bandTint ? " tint" : "") + (isEdge ? " edge" : "") + (isRem ? " rem" : "")}
                        style={{
                          height: t, marginTop: dgap,
                          background: `linear-gradient(180deg, ${COLORS[i].ink}, ${shade(COLORS[i].ink)})`,
                          animationDelay: `${Math.min(d, 12) * 14}ms`,
                        }}
                      />
                    );
                  })}
                </div>
                <div className="dd-base" style={{ background: COLORS[i].ink }} />
              </div>

              <div className="dd-pole-name" style={{ color: COLORS[i].ink }}>{COLORS[i].name}</div>

              <div className="dd-pstep" style={{ borderColor: COLORS[i].ink }} onClick={(e) => e.stopPropagation()}>
                <button onClick={(e) => { e.stopPropagation(); editPile(i, -1); }} aria-label="remove disc">–</button>
                <span className="dd-pstep-v">{initial[i]}</span>
                <button onClick={(e) => { e.stopPropagation(); editPile(i, +1); }} aria-label="add disc">+</button>
              </div>
            </div>
          );
        })}

        {fly && (
          <div
            key={fly.key} className="dd-fly" onAnimationEnd={() => setFly(null)}
            style={{
              color: fly.color, borderColor: fly.color, animationDuration: fly.dur + "ms",
              "--x0": fly.x0 + "px", "--y0": fly.y0 + "px", "--xm": fly.xm + "px",
              "--ym": fly.ym + "px", "--x1": fly.x1 + "px", "--y1": fly.y1 + "px",
            }}
          >+{fly.amount}</div>
        )}
      </div>

      {mode === "auto" ? (
        <div className="dd-transport">
          <button className="t-btn" onClick={reset} title="Reset"><RotateCcw size={16} /></button>
          <button className="t-btn" onClick={back} disabled={step === 0}><SkipBack size={16} /></button>
          <button className="t-btn play" onClick={() => setPlaying((p) => !p)} disabled={step >= plan.moves.length}>
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button className="t-btn" onClick={forward} disabled={step >= plan.moves.length}><SkipForward size={16} /></button>
          <input className="dd-speed" type="range" min={1} max={4} step={1} value={speed} onChange={(e) => setSpeed(+e.target.value)} title="speed" />
        </div>
      ) : (
        <div className="dd-transport play">
          {solved
            ? <span className="dd-hint">a pole is empty <button className="t-btn" onClick={reset}><RotateCcw size={15} /></button></span>
            : sel === null
              ? <span className="dd-hint">tap a pole to <em>receive</em> (it doubles)</span>
              : <span className="dd-hint">tap a donor with ≥ {piles[sel]} <button className="t-btn" onClick={() => setSel(null)} title="cancel">×</button></span>}
        </div>
      )}

      {mode === "auto" && plan.rounds.length > 0 && (
        <div className="dd-descent">
          {plan.rounds.map((rd, k) => (
            <Fragment key={k}>
              <span className={"dmin" + (k === activeRoundIdx && !solved ? " cur" : k < activeRoundIdx || solved ? " past" : "")}>{rd.startMin}</span>
              <span className="dchev">›</span>
            </Fragment>
          ))}
          <span className={"dmin zero" + (solved ? " cur" : "")}>0</span>
        </div>
      )}

      {mode === "auto" && (
      <aside className="dd-proof">
        <div className="dd-proof-head">The proof</div>
        <p>
          Order the piles <span className="m">a ≤ b ≤ c</span>. We empty a pole by driving the
          smallest pile down — and the engine is one round repeated.
        </p>
        <p>
          <b>One round.</b> Let <span className="m">q = ⌊b/a⌋</span> and <span className="m">r = b − a·q</span>,
          so <span className="m">r &lt; a</span>. Write <span className="m">q</span> in binary and double the
          smallest pile bit by bit, least-significant first: at step <span className="m">i</span> it holds
          <span className="m"> 2ⁱ·a</span>, and we pour that amount from <span className="m">b</span> when bit
          <span className="m"> i</span> is a 1, from <span className="m">c</span> when it is a 0. Throughout, the
          donor obeys <span className="m">b = a·q + r</span>: each doubling <em>doubles</em> <span className="m">a</span>
          and <em>shifts</em> <span className="m">q</span> one place right, while <span className="m">r</span> never moves.
          When the bits run out, <span className="m">b</span> has given away exactly <span className="m">a·q</span> and
          settles at <span className="m">r</span>.
        </p>
        <p>
          <b>Why it ends.</b> The smallest pile fell from <span className="m">a</span> to <span className="m">r &lt; a</span> —
          a strictly smaller minimum. A non-negative integer cannot decrease forever, so the minimum must reach
          <span className="m"> 0</span>: an empty pole. <span className="qed">∎</span>
        </p>
        <p className="dd-proof-foot">
          Every move is legal: on a 1-bit, <span className="m">b</span> still holds enough because its higher bits are
          untouched; on a 0-bit, <span className="m">c ≥ b</span> is large enough since only smaller powers have been spent.
        </p>
      </aside>
      )}
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,500&family=Newsreader:ital,opsz@0,6..72;1,6..72&family=JetBrains+Mono:wght@400;600&display=swap');

.dd-root{
  --paper:#FBF7EC; --paper2:#F4ECD8; --ink:#1E1B16; --ink-soft:#6c655a; --line:#ddd2b8;
  font-family:'Newsreader',Georgia,serif; color:var(--ink);
  background:
    radial-gradient(120% 80% at 15% -10%, #fffdf6 0%, rgba(255,253,246,0) 55%),
    radial-gradient(120% 90% at 100% 0%, #f6efdc 0%, rgba(246,239,220,0) 50%),
    var(--paper);
  min-height:100vh; padding:30px clamp(16px,5vw,60px) 48px; box-sizing:border-box;
  display:flex; flex-direction:column; align-items:center; -webkit-font-smoothing:antialiased;
}
.dd-root *{box-sizing:border-box}
.m{font-family:'JetBrains Mono',monospace; font-size:.92em; white-space:nowrap}

.dd-head{text-align:center; margin-bottom:20px}
.dd-title{font-family:'Fraunces',serif; font-weight:600; font-size:clamp(32px,6vw,52px); line-height:1; margin:0 0 8px; letter-spacing:-.015em}
.dd-rule{font-family:'JetBrains Mono',monospace; font-size:12px; letter-spacing:.08em; color:var(--ink-soft); margin:0}
.dd-rule em{font-style:normal; color:var(--ink); font-weight:600}
.dd-sub{font-family:'Newsreader',serif; font-size:16.5px; line-height:1.6; color:#4a4335;
  max-width:58ch; margin:14px auto 0; text-align:left}
.dd-sub b{font-weight:600; color:var(--ink)}
.dd-sub em{font-style:italic}

.dd-config{display:flex; gap:8px; align-items:center; flex-wrap:wrap; justify-content:center; margin-bottom:16px}
.dd-chip{font-family:'JetBrains Mono',monospace; font-size:12px; padding:7px 12px; height:36px; border:1px solid var(--line);
  border-radius:9px; background:#fffdf6; cursor:pointer; color:#473f30; transition:.15s; display:inline-flex; align-items:center; gap:6px}
.dd-chip:hover{background:var(--ink); color:var(--paper); border-color:var(--ink)}
.dd-divider{width:1px; height:24px; background:var(--line); margin:0 4px}
.dd-modeswitch{display:inline-flex; border:1px solid var(--line); border-radius:20px; overflow:hidden; background:#fffdf6}
.dd-modeswitch button{border:0; background:transparent; padding:8px 18px; cursor:pointer; font-family:'Newsreader',serif; font-size:14px; color:var(--ink-soft)}
.dd-modeswitch button.on{background:var(--ink); color:var(--paper)}

.dd-poles{position:relative; display:flex; justify-content:center; align-items:flex-end;
  gap:clamp(20px,7vw,86px); width:100%; max-width:780px; padding:120px 10px 6px}
.dd-pole{position:relative; display:flex; flex-direction:column; align-items:center; gap:10px; padding:6px; border-radius:12px; transition:background .2s}
.dd-pole.clickable{cursor:pointer}
.dd-pole.clickable:hover{background:rgba(255,255,255,.5)}
.dd-pole.sel{background:rgba(255,255,255,.85); box-shadow:inset 0 0 0 2px var(--ink)}
.dd-pole.shake{animation:dd-shake .4s}
@keyframes dd-shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}

.dd-count{font-family:'Fraunces',serif; font-weight:600; font-size:34px; line-height:1; display:flex; align-items:baseline; gap:7px}
.dd-tag{font-family:'JetBrains Mono',monospace; font-size:10px; letter-spacing:.05em; background:var(--ink); color:var(--paper);
  padding:3px 7px; border-radius:20px; animation:dd-breathe 1.8s infinite}
@keyframes dd-breathe{0%,100%{opacity:.5}50%{opacity:1}}

.dd-stack{position:relative; width:84px; display:flex; flex-direction:column; justify-content:flex-end; align-items:center}
.dd-rod{position:absolute; bottom:6px; top:4px; width:6px; border-radius:4px; background:rgba(30,27,22,.12)}
.dd-discs{position:relative; display:flex; flex-direction:column-reverse; align-items:center; width:100%; z-index:2; padding-bottom:6px}
.dd-disc{width:84%; border-radius:6px; box-shadow:0 1px 0 rgba(255,255,255,.45) inset, 0 1px 2px rgba(30,27,22,.22);
  animation:dd-drop .34s cubic-bezier(.2,1.3,.4,1) both; position:relative; transition:filter .25s}
.dd-disc.tint{filter:brightness(1.16) saturate(.78)}
.dd-disc.rem{opacity:.34; filter:grayscale(.4)}
.dd-disc.edge::before{content:""; position:absolute; top:-2px; left:-9%; right:-9%; height:2px;
  background:repeating-linear-gradient(90deg,var(--paper) 0 4px,transparent 4px 8px); opacity:.95}
@keyframes dd-drop{from{opacity:0; transform:translateY(-10px) scaleX(.6)}to{opacity:1; transform:none}}
.dd-base{position:absolute; bottom:0; height:6px; width:100%; border-radius:4px; opacity:.85}
.dd-pole-name{font-family:'JetBrains Mono',monospace; font-size:11px; letter-spacing:.2em; opacity:.8}

.dd-pstep{display:inline-flex; align-items:center; border:1px solid; border-radius:20px; overflow:hidden;
  background:#fffdf6; opacity:.85; transition:.15s}
.dd-pstep:hover{opacity:1}
.dd-pstep button{width:26px; height:26px; border:0; background:transparent; font-size:16px; cursor:pointer; color:var(--ink-soft); font-family:inherit; line-height:1}
.dd-pstep button:hover{background:var(--paper2); color:var(--ink)}
.dd-pstep-v{min-width:22px; text-align:center; font-family:'JetBrains Mono',monospace; font-size:12px; font-weight:600; color:var(--ink-soft)}

.dd-decomp{position:absolute; bottom:calc(100% + 8px); left:50%; transform:translateX(-50%);
  display:flex; flex-direction:column; align-items:center; z-index:12; animation:dd-pop .35s both}
.dd-decomp-row{display:flex; align-items:center; gap:7px; padding:9px 14px; border-radius:13px; background:#fffdf6;
  border:1px solid var(--c); box-shadow:0 6px 18px rgba(30,27,22,.12); font-family:'Fraunces',serif; white-space:nowrap}
.dd-decomp-tip{width:0; height:0; border-left:8px solid transparent; border-right:8px solid transparent;
  border-top:9px solid var(--c); margin-top:-1px; filter:drop-shadow(0 4px 3px rgba(30,27,22,.10))}
.dd-eq{font-weight:600; font-size:25px; line-height:1; min-width:16px; text-align:center; transition:color .2s}
.dd-op{font-family:'JetBrains Mono',monospace; color:var(--ink-soft); font-size:15px}
.dd-bits{display:inline-flex; align-items:center; gap:4px; padding:5px 8px; border-radius:9px; background:var(--paper2)}
.bit{font-family:'JetBrains Mono',monospace; font-weight:600; font-size:15px; width:22px; height:24px; border-radius:5px;
  display:inline-flex; align-items:center; justify-content:center; transition:.2s}
.bit[data-b="1"]{background:var(--ink); color:var(--paper)}
.bit[data-b="0"]{color:var(--ink-soft); border:1px solid var(--line)}
.shiftmark{font-family:'JetBrains Mono',monospace; color:var(--ink-soft); font-size:15px; opacity:.55; margin:0 1px}
.drop{font-family:'JetBrains Mono',monospace; font-weight:600; font-size:11px; width:17px; height:17px; border:1px solid;
  border-radius:4px; display:inline-flex; align-items:center; justify-content:center; opacity:.85}
.drop.new{animation:dd-fall .45s cubic-bezier(.3,1.2,.5,1) both}
@keyframes dd-fall{from{opacity:0; transform:translateX(-10px) translateY(-4px) scale(.6)}to{opacity:.85; transform:none}}
.dd-rem-eq{font-family:'JetBrains Mono',monospace; font-weight:600; font-size:18px; color:var(--ink-soft);
  border:1px dashed var(--line); border-radius:7px; padding:2px 9px}
@keyframes dd-pop{from{opacity:0; transform:translateX(-50%) translateY(6px)}to{opacity:1}}

.dd-fly{position:absolute; top:0; left:0; z-index:30; width:58px; text-align:center; font-family:'JetBrains Mono',monospace;
  font-weight:600; font-size:15px; padding:6px 0; background:#fffdf6; border:1.5px solid; border-radius:20px; pointer-events:none;
  box-shadow:0 6px 18px rgba(30,27,22,.18); animation-name:dd-fly; animation-timing-function:cubic-bezier(.45,0,.25,1); animation-fill-mode:forwards}
@keyframes dd-fly{
  0%{transform:translate(var(--x0),var(--y0)) scale(.7); opacity:0}
  14%{opacity:1; transform:translate(var(--x0),var(--y0)) scale(1)}
  50%{transform:translate(var(--xm),var(--ym)) scale(1.14)}
  88%{opacity:1}
  100%{transform:translate(var(--x1),var(--y1)) scale(.78); opacity:0}}

.dd-transport{display:flex; align-items:center; gap:10px; margin-top:22px; padding:10px 14px; border:1px solid var(--line); border-radius:30px; background:#fffdf6}
.dd-transport.play{border-radius:24px; padding:9px 16px}
.t-btn{width:36px; height:36px; border-radius:50%; border:1px solid var(--line); background:var(--paper); cursor:pointer;
  display:inline-flex; align-items:center; justify-content:center; color:var(--ink); transition:.15s}
.t-btn:hover:not(:disabled){background:var(--paper2)}
.t-btn:disabled{opacity:.32; cursor:default}
.t-btn.play{width:44px; height:44px; background:var(--ink); color:var(--paper); border-color:var(--ink)}
.dd-speed{accent-color:var(--ink); width:96px; margin-left:4px}
.dd-hint{font-size:15px; color:#473f30; display:inline-flex; align-items:center; gap:9px}
.dd-hint em{font-style:italic; font-weight:600; color:var(--ink)}

.dd-descent{display:flex; align-items:center; gap:7px; margin-top:22px; flex-wrap:wrap; justify-content:center}
.dmin{font-family:'JetBrains Mono',monospace; font-weight:600; font-size:15px; min-width:30px; text-align:center;
  padding:5px 7px; border-radius:8px; background:var(--paper2); color:var(--ink-soft); transition:.2s}
.dmin.past{color:var(--ink)}
.dmin.cur{background:var(--ink); color:var(--paper); transform:scale(1.12)}
.dmin.zero{border:1px dashed var(--line); background:transparent}
.dchev{color:var(--ink-soft); font-size:15px}

.dd-proof{max-width:560px; margin:46px auto 0; padding:22px 26px; border:1px solid var(--line); border-radius:14px;
  background:rgba(255,253,246,.55); color:#4a4335}
.dd-proof-head{font-family:'JetBrains Mono',monospace; font-size:10.5px; letter-spacing:.2em; text-transform:uppercase;
  color:var(--ink-soft); margin-bottom:10px}
.dd-proof p{font-family:'Newsreader',serif; font-size:14.5px; line-height:1.62; margin:0 0 11px}
.dd-proof p:last-child{margin-bottom:0}
.dd-proof b{font-weight:600; color:var(--ink)}
.dd-proof em{font-style:italic}
.dd-proof .m{color:var(--ink)}
.dd-proof .qed{font-family:'Fraunces',serif; font-size:16px}
.dd-proof-foot{border-top:1px dashed var(--line); padding-top:11px; color:var(--ink-soft); font-size:13px}
`;

ReactDOM.createRoot(document.getElementById("app")).render(<App />);
