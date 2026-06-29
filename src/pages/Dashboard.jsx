import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// ================================================================
// テーマカラー動的定義 (Portalと完全に同期)
// ================================================================
const getColors = (isDark) => ({
  bg: isDark ? "#0a0f1a" : "#f8fafc",      // 背景（深ネイビー / 薄グレー）
  card: isDark ? "#121c2e" : "#ffffff",    // カード（ダークネイビー / 純白）
  line: isDark ? "#1e2d45" : "#e2e8f0",    // 境界線
  text: isDark ? "#e2e8f0" : "#0f172a",    // メイン文字
  muted: isDark ? "#4a6080" : "#64748b",   // 補助文字
  acc: "#0052cc",     // コーポレートブルー
  green: "#0284c7",   // 利益・ポジティブカラー
  amber: isDark ? "#f59e0b" : "#b45309",   // 警告・注意
  red: "#ea580c",     // 損失・ネガティブカラー
  purple: isDark ? "#a78bfa" : "#7c3aed",  // iDeCo等
});

// ================================================================
// ヘルパー（すべて「#,###」のフル桁カンマ表示に統一）
// ================================================================
const fmt = (n) => "¥" + Math.abs(Math.round(n)).toLocaleString("ja-JP");
const pnlClr = (n) => (n >= 0 ? C.green : C.red);
const sgn    = (n) => (n >= 0 ? "+" : "");

// ================================================================
// JA共済 複利計算（月次積立）
// ================================================================
function monthsBetween(d1, d2) {
  return (d2.getFullYear() - d1.getFullYear()) * 12 + d2.getMonth() - d1.getMonth();
}
function calcJA(c) {
  const start = new Date(c.startDate);
  const now   = new Date();
  const total = Math.max(0, monthsBetween(start, now));
  const p1    = Math.min(c.rate1Years * 12, total);
  const p2    = Math.max(0, total - p1);
  const r1    = c.rate1 / 12;
  const r2    = c.rate2 / 12;
  const pmt   = c.monthlyPayment;
  const fv1   = p1 > 0 ? pmt * ((Math.pow(1 + r1, p1) - 1) / r1) : 0;
  const fvG   = fv1 * Math.pow(1 + r2, p2);
  const fv2   = p2 > 0 ? pmt * ((Math.pow(1 + r2, p2) - 1) / r2) : 0;
  const cost  = total * pmt;
  const value = Math.round(fvG + fv2);
  return { months: total, cost, value, pnl: value - cost };
}

// ================================================================
// 【最新データ拡張】証券（Robofolio: SBI 本人/妻 + 日興 子供3名の詳細データを完全マッピング）
// ================================================================
const DATA_DATE = "2026/06/28";

const RF_ITEMS = [
  // ── 本人 SBI ──
  { name:"eMAXIS Slim オルカン",  sub:"NISA成長", amount:3696245, pnl: 864206, owner:"本人", acc:"SBI", costPrice: 28852.55, qty: 981556, price: 37657, divYield: "-", divMonth: "-" },
  { name:"iS米国債七十(1655)",     sub:"NISA",    amount:2044590, pnl:  44310, owner:"本人", acc:"SBI", costPrice: 316.00,    qty: 6330,   price: 323,   divYield: "-", divMonth: "-" },
  { name:"iS米国債37ヘジ(2856)",   sub:"特定",    amount:2009950, pnl: -27450, owner:"本人", acc:"SBI", costPrice: 668.00,    qty: 3050,   price: 659,   divYield: "-", divMonth: "-" },
  { name:"SBI高配当株式",          sub:"NISA",    amount:1571655, pnl: 361979, owner:"本人", acc:"SBI", costPrice: 19249.00,   qty: 628436, price: 25009, divYield: "-", divMonth: "-" },
  { name:"eMAXIS Slim オルカン",  sub:"特定",     amount: 692052, pnl:  32051, owner:"本人", acc:"SBI", costPrice: 35913.00,   qty: 183778, price: 37657, divYield: "-", divMonth: "-" },
  { name:"eMAXIS Slim S&P500",    sub:"特定",     amount: 218235, pnl:   8235, owner:"本人", acc:"SBI", costPrice: 42102.00,   qty: 49879,  price: 43753, divYield: "-", divMonth: "-" },
  { name:"eMAXIS Slim S&P500",    sub:"NISA",     amount: 112147, pnl:  12147, owner:"本人", acc:"SBI", costPrice: 39014.00,   qty: 25632,  price: 43753, divYield: "-", divMonth: "-" },
  { name:"ニッセイNASDAQ100",      sub:"特定",     amount:  32971, pnl:   2971, owner:"本人", acc:"SBI", costPrice: 25655.00,   qty: 11694,  price: 28195, divYield: "-", divMonth: "-" },
  { name:"eMAXIS Neo 宇宙開発",   sub:"特定",     amount:   2742, pnl:    242, owner:"本人", acc:"SBI", costPrice: 51653.00,   qty: 484,    price: 56654, divYield: "-", divMonth: "-" },
  // ── 妻 SBI ──
  { name:"eMAXIS Slim オルカン",  sub:"NISA",     amount: 236335, pnl:  16330, owner:"妻",   acc:"SBI", costPrice: 35055.00,   qty: 62760,  price: 37657, divYield: "-", divMonth: "-" },
  { name:"eMAXIS Slim S&P500",    sub:"NISA",     amount: 169446, pnl:   9446, owner:"妻",   acc:"SBI", costPrice: 41314.00,   qty: 38728,  price: 43753, divYield: "-", divMonth: "-" },
  { name:"ニッセイNASDAQ100",      sub:"NISA",     amount: 164836, pnl:  14832, owner:"妻",   acc:"SBI", costPrice: 25658.00,   qty: 58463,  price: 28195, divYield: "-", divMonth: "-" },
  { name:"SBI高配当株式 年4回",    sub:"NISA",     amount: 161526, pnl:  29159, owner:"妻",   acc:"SBI", costPrice: 12511.00,   qty: 105801, price: 15267, divYield: "-", divMonth: "-" },
  { name:"日本株配当オープン",      sub:"NISA",     amount:    734, pnl:     68, owner:"妻",   acc:"SBI", costPrice: 15708.00,   qty: 424,    price: 17326, divYield: "-", divMonth: "-" },
  // ── 子供 日興 ──
  { name:"日本株配当オープン",      sub:"特定",     amount: 550355, pnl:  46401, owner:"長女", acc:"日興", costPrice: 15294.74,   qty: 329495, price: 16703, divYield: "-", divMonth: "-" },
  { name:"楽天全米株式",           sub:"特定",     amount: 237929, pnl:  57929, owner:"長女", acc:"日興", costPrice: 33313.60,   qty: 54032,  price: 44035, divYield: "-", divMonth: "-" },
  { name:"eMAXIS Slim S&P500",    sub:"特定",     amount: 770837, pnl: 100837, owner:"次女", acc:"日興", costPrice: 37905.15,   qty: 176757, price: 43610, divYield: "-", divMonth: "-" },
  { name:"eMAXIS Slim S&P500",    sub:"特定",     amount: 281572, pnl:  22572, owner:"長男", acc:"日興", costPrice: 40114.00,   qty: 64566,  price: 43610, divYield: "-", divMonth: "-" },
  { name:"eMAXIS Slim オルカン",  sub:"特定",     amount: 124059, pnl:  32060, owner:"長男", acc:"日興", costPrice: 27556.46,   qty: 33386,  price: 37159, divYield: "-", divMonth: "-" },
  { name:"SBI高配当株式",          sub:"特定",     amount: 278484, pnl:  19484, owner:"長男", acc:"日興", costPrice: 22937.41,   qty: 112916, price: 24663, divYield: "-", divMonth: "-" },
];
const RF_TOTAL = RF_ITEMS.reduce((s, i) => s + i.amount, 0);
const RF_PNL   = RF_ITEMS.reduce((s, i) => s + i.pnl,    0);
const RF_COST  = RF_TOTAL - RF_PNL;

// 銀行口座
const BANK_ITEMS = [
  { name:"SMBC 本人",             amount:2264792, src:"MT", owner:"本人" },
  { name:"SMBC 妻",               amount: 887749, src:"MT", owner:"妻"   },
  { name:"SMBC 長女",             amount:  10074, src:"MT", owner:"長女" },
  { name:"SMBC 次女",             amount:  10074, src:"MT", owner:"次女" },
  { name:"SMBC 長男",             amount:  10166, src:"MT", owner:"長男" },
  { name:"UFJ 本人",              amount:    566, src:"MT", owner:"本人" },
  { name:"住信SBI 代表口座",      amount:    114, src:"MF", owner:"本人" },
  { name:"住信SBI ハイブリッド",  amount:4396031, src:"MF", owner:"本人" },
];
const BANK_TOTAL = BANK_ITEMS.reduce((s, i) => s + i.amount, 0);

// ドル建て資産
const USD_ITEMS = [
  { name:"米ドル建債券（本人/特定）", usd:14816.34, owner:"本人" },
  { name:"米ドルMMF（本人/特定）",   usd: 7000.00, owner:"本人" },
  { name:"米ドル現金（本人）",        usd: 7000.00, owner:"本人" },
  { name:"米ドルMMF（妻/特定）",     usd: 7000.00, owner:"妻"   },
  { name:"米ドル現金（妻）",          usd: 7000.00, owner:"妻"   },
];
const USD_SUM = USD_ITEMS.reduce((s, i) => s + i.usd, 0);

// iDeCo
const IDECO_ITEMS = [
  { name:"eMAXIS Slim 全世界(除く日本)", amount:112673, cost:93245, pnl:19428, costPrice: "-", qty: "-", price: "-", divYield: "-", divMonth: "-" },
  { name:"eMAXIS Slim S&P500",          amount:  1639, cost: 1268, pnl:   371, costPrice: "-", qty: "-", price: "-", divYield: "-", divMonth: "-" },
  { name:"eMAXIS Slim 国内株式(TOPIX)", amount: 14676, cost:11295, pnl:  3381, costPrice: "-", qty: "-", price: "-", divYield: "-", divMonth: "-" },
  { name:"eMAXIS Slim 新興国株式",      amount:   878, cost:  561, pnl:   317, costPrice: "-", qty: "-", price: "-", divYield: "-", divMonth: "-" },
];
const IDECO_TOTAL = IDECO_ITEMS.reduce((s, i) => s + i.amount, 0);
const IDECO_COST  = IDECO_ITEMS.reduce((s, i) => s + i.cost,   0);
const IDECO_PNL   = IDECO_ITEMS.reduce((s, i) => s + i.pnl,    0);

// ソニー生命
const SONY_ITEMS = [
  { id:1, name:"契約1", certNo:"3607496942", amount:3258542, cost:2206200 },
  { id:2, name:"契約2", certNo:"3826415397", amount:1428395, cost:1155932 },
];
const SONY_TOTAL = SONY_ITEMS.reduce((s, i) => s + i.amount, 0);
const SONY_COST  = SONY_ITEMS.reduce((s, i) => s + i.cost,   0);
const SONY_PNL   = SONY_TOTAL - SONY_COST;

// JA共済 初期契約データ
const INIT_JA = [{
  id:"JA-001", archived:false,
  name:"JA共済 個人年金", type:"個人年金（旧）",
  policyId:"2308432346", certNo:"23220002997823",
  holder:"岡野一貴", beneficiary:"岡野一貴",
  monthlyPayment:10000, startDate:"2011-08-18",
  rate1:0.009, rate1Years:5, rate2:0.0075, termYears:36,
  annuityStartYear:2048, annuityEndYear:2058,
  minAnnualAmount:465300, confirmedAnnualAmount:494000,
  notes:"当初5年 0.9% → 以降 0.75%最低保証\n最低4,653,000円（46.53万×10年）\n年金受取: 2048〜2058年（10年間）\n23/3/1 49.2万/年・25/9/1 49.4万/年 ✓確認済",
}];

const MT_TOTAL  = 27656_207;
const MF_UNIQUE =  4396_145;
const IDECO_ADJ =      3667;

const MISSING_LIST = [
  { name:"SCB タイバーツ口座",     status:"スクリプト作成中",  done:false },
  { name:"暗号資産（各ウォレット）",status:"複雑なため検討中",  done:false },
  { name:"FX残高（Equity）",       status:"✓ FXタブに分離済み", done:true  },
  { name:"退職金・確定拠出(DB)",   status:"将来（現職継続中）", done:false },
  { name:"社員持株会",             status:"手入力実装予定",     done:false },
  { name:"住宅（不動産）",          status:"将来（購入予定）",   done:false },
];

// ================================================================
// UI パーツ
// ================================================================
const TAG_C = { 
  MT: { bg: "#e0f2fe", text: "#0369a1", label: "MoneyTree" }, 
  MF: { bg: "#f3e8ff", text: "#6b21a8", label: "MoneyFwd" }, 
  SL: { bg: "#ffedd5", text: "#b45309", label: "SonyLife" }, 
  JA: { bg: "#dcfce7", text: "#15803d", label: "JA共済" } 
};

const Tag = ({ src }) => {
  const cfg = TAG_C[src] || { bg: "#f1f5f9", text: "#475569", label: src };
  return (
    <span style={{
      background: cfg.bg, color: cfg.text,
      fontSize: 10, padding: "2px 6px", borderRadius: 6, marginLeft: 6, whiteSpace: "nowrap",
      fontWeight: 600
    }}>
      {cfg.label}
    </span>
  );
};

const SecHead = ({ title, total, cost, pnl }) => {
  const rPct = (cost > 0 && pnl !== undefined) ? (pnl / cost * 100).toFixed(1) : null;
  return (
    <div style={{
      display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap",
      margin: "24px 0 12px", borderLeft: `4px solid ${C.acc}`, paddingLeft: 12,
    }}>
      <span style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>{title}</span>
      <span style={{ color: C.text, fontWeight: 600, fontSize: 14 }}>{fmt(total)}</span>
      {pnl !== undefined && (
        <span style={{ color: pnlClr(pnl), fontSize: 12, fontWeight: 600 }}>
          {sgn(pnl)}{fmt(pnl)}{rPct ? ` (${sgn(pnl)}${rPct}%)` : ""}
        </span>
      )}
    </div>
  );
};

// ================================================================
// JA共済 フォーム
// ================================================================
function JaField({ label, value, onChange, type="text", rows }) {
  const base = {
    width: "100%", background: "#ffffff", border: `1px solid ${C.line}`,
    color: C.text, borderRadius: 8, padding: "8px 12px", fontSize: 13,
    boxSizing: "border-box", marginTop: 4, transition: "border-color .2s"
  };
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, display: "block" }}>{label}</label>
      {rows
        ? <textarea rows={rows} value={value} onChange={e=>onChange(e.target.value)} style={{...base, resize: "vertical"}}/>
        : <input type={type} value={value}
            onChange={e=>onChange(type==="number" ? Number(e.target.value) : e.target.value)}
            style={base}/>
      }
    </div>
  );
}

function JaEditForm({ contract, onChange, onSave, onCancel }) {
  const set = (field) => (val) => onChange({ ...contract, [field]: val });
  return (
    <div style={{ padding: 4 }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: C.green }}>契約編集</div>
      <JaField label="名称"              value={contract.name}                    onChange={set("name")} />
      <JaField label="証券番号"          value={contract.certNo}                  onChange={set("certNo")} />
      <JaField label="月額払込（円）"    value={contract.monthlyPayment}          onChange={set("monthlyPayment")} type="number" />
      <JaField label="確認済み年金額（円/年）" value={contract.confirmedAnnualAmount} onChange={set("confirmedAnnualAmount")} type="number" />
      <JaField label="備考"              value={contract.notes}                   onChange={set("notes")} rows={4} />
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={onSave}   style={{ background: C.acc, border: "none", color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>保存</button>
        <button onClick={onCancel} style={{ background: "#f1f5f9",    border: "none", color: C.muted,    borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}>キャンセル</button>
      </div>
    </div>
  );
}

function JaAddForm({ onAdd, onCancel }) {
  const [f, setF] = useState({
    name:"", type:"個人年金", policyId:"", certNo:"",
    holder:"岡野一貴", beneficiary:"岡野一貴",
    monthlyPayment:0, startDate:"",
    rate1:0.009, rate1Years:5, rate2:0.0075, termYears:0,
    annuityStartYear:0, annuityEndYear:0,
    minAnnualAmount:0, confirmedAnnualAmount:0,
    notes:"", archived:false,
  });
  const set = (field) => (val) => setF(prev => ({ ...prev, [field]: val }));
  return (
    <div style={{ background: "#ffffff", border: `1px solid ${C.line}`, borderRadius: 16, padding: "16px 20px", marginTop: 12, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: C.acc }}>新規契約追加</div>
      <JaField label="名称"           value={f.name}           onChange={set("name")} />
      <JaField label="証券番号"       value={f.certNo}         onChange={set("certNo")} />
      <JaField label="契約開始日"     value={f.startDate}      onChange={set("startDate")} type="date" />
      <JaField label="月額払込（円）" value={f.monthlyPayment} onChange={set("monthlyPayment")} type="number" />
      <JaField label="備考"           value={f.notes}          onChange={set("notes")} rows={3} />
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button onClick={()=>onAdd({ ...f, id:`JA-${Date.now()}` })}
          style={{ background: C.acc, border: "none", color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>追加</button>
        <button onClick={onCancel}
          style={{ background: "#f1f5f9", border: "none", color: C.muted, borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}>キャンセル</button>
      </div>
    </div>
  );
}

// ================================================================
// 各種定義
// ================================================================
const TABS   = ["summary","pnl","securities","banks","insurance","missing"];
const TAB_LB = {
  summary:"📊 サマリー", pnl:"💹 投資収益", securities:"📈 証券銘柄",
  banks:"🏦 銀行/外貨", insurance:"🛡 保険/年金", missing:"⚠️ 未連携",
};

let C;

export default function Dashboard() {
  const [tab,     setTab]     = useState("summary");
  const [usdJpy,  setUsdJpy]  = useState(null);
  const [usdLoad, setUsdLoad] = useState(true);
  const [jaList,  setJaList]  = useState(INIT_JA);
  const [editJa,  setEditJa]  = useState(null);
  const [addMode, setAddMode] = useState(false);
  const [theme,   setTheme]   = useState("light");

  useEffect(() => {
    const savedTheme = localStorage.getItem("okano-app-theme") || "light";
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("okano-app-theme", nextTheme);
  };

  const isDark = theme === "dark";
  C = getColors(isDark);

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then(r => r.json())
      .then(d => { setUsdJpy(d.rates?.JPY || null); setUsdLoad(false); })
      .catch(() => setUsdLoad(false));
  }, []);

  const jaActive = jaList.filter(c => !c.archived);
  const jaCalc   = jaActive.map(c => ({ ...c, ...calcJA(c) }));
  const jaTotal  = jaCalc.reduce((s, c) => s + c.value, 0);
  const jaCost   = jaCalc.reduce((s, c) => s + c.cost,  0);
  const jaPnl    = jaCalc.reduce((s, c) => s + c.pnl,   0);

  const GRAND_TOTAL = MT_TOTAL + MF_UNIQUE + SONY_TOTAL + IDECO_ADJ + jaTotal;

  const pnlRows = [
    { label:"証券（SBI/日興）", cost:RF_COST,   value:RF_TOTAL,   color:C.acc },
    { label:"iDeCo",            cost:IDECO_COST, value:IDECO_TOTAL, color:C.purple, note:"MF取得価額使用" },
    { label:"ソニー生命",        cost:SONY_COST,  value:SONY_TOTAL,  color:"#f97316" },
    { label:"JA共済（計算値）",  cost:jaCost,     value:jaTotal,    color:"#10b981", note:"複利計算（0.9%→0.75%）" },
  ];
  const invCost  = pnlRows.reduce((s, r) => s + r.cost,  0);
  const invValue = pnlRows.reduce((s, r) => s + r.value, 0);
  const invPnl   = invValue - invCost;

  const pieMisc = Math.max(0, GRAND_TOTAL - BANK_TOTAL - RF_TOTAL - IDECO_TOTAL - SONY_TOTAL - jaTotal);
  const pieData = [
    { name:"現金・預金（円）",  value:BANK_TOTAL,  color:"#0284c7" },
    { name:"証券（投信/株）",  value:RF_TOTAL,    color:"#0052cc" },
    { name:"債券・外貨・他",   value:pieMisc,     color:"#6366f1" },
    { name:"iDeCo",           value:IDECO_TOTAL, color:C.purple },
    { name:"ソニー生命",       value:SONY_TOTAL,  color:"#f97316" },
    { name:"JA共済",           value:jaTotal,     color:"#10b981" },
  ];

  const usdJpySum = usdJpy ? Math.round(USD_SUM * usdJpy) : 0;

  const saveJa    = (updated) => { setJaList(l => l.map(c => c.id===updated.id ? updated : c)); setEditJa(null); };
  const archiveJa = (id)      => setJaList(l => l.map(c => c.id===id ? { ...c, archived:!c.archived } : c));
  const addJa     = (c)       => { setJaList(l => [...l, c]); setAddMode(false); };

  const Th = ({ children, right }) => (
    <th style={{ textAlign: right ? "right" : "left", padding: "10px 8px", color: C.muted, fontWeight: 600, fontSize: 12, borderBottom: `2px solid ${C.line}`, whiteSpace: "nowrap" }}>
      {children}
    </th>
  );

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", padding: 16, transition: "background 0.3s, color 0.3s" }}>

      {/* ── スマホ画面上部の押し下げ用アクセントバー（高さを2.5倍の90pxに拡張＆ボタン位置調整） ── */}
      <div style={{ 
        background: C.acc, 
        height: "90px", 
        margin: "-16px -16px 16px -16px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        display: "flex",
        alignItems: "flex-end",       // ボタンを下側に配置して親指を届きやすく
        justifyContent: "flex-end",
        padding: "0 16px 14px 16px",  // 下部に程よいマージン
        boxSizing: "border-box"
      }}>
        <button 
          onClick={toggleTheme}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            borderRadius: "20px",
            color: "#fff",
            padding: "6px 16px",        // タップ領域を少し広げて押しやすく
            fontSize: "12px",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            outline: "none",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}
        >
          {isDark ? "☀️ LIGHT" : "🌙 DARK"}
        </button>
      </div>

      {/* ── ヘッダー ── */}
      <div style={{ background: C.card, borderRadius: 16, padding: "20px", marginBottom: 16, border: `1px solid ${C.line}`, boxShadow: isDark ? "0 4px 6px -1px rgba(0,0,0,0.5)" : "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
        <button onClick={() => window.history.back()}
          style={{ background: "none", border: "none", color: C.acc, fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: 12, padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
          ← ポータルへ
        </button>
        <div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, letterSpacing: "0.05em" }}>岡野ファミリー 総合資産</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: isDark ? "#ffffff" : C.text, marginTop: 4, letterSpacing: "-0.02em" }}>
            {fmt(GRAND_TOTAL)}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
            {DATA_DATE} ｜ 負債ネット済 ｜ JA共済計算値含む
          </div>
        </div>

        {/* USD/JPY レート */}
        <div style={{ marginTop: 12, fontSize: 12, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", borderTop: `1px solid ${C.line}`, paddingTop: 10 }}>
          {usdLoad
            ? <span style={{ color: C.muted }}>USD/JPY 取得中…</span>
            : usdJpy
            ? <>
                <span style={{ color: C.green, fontWeight: 700 }}>USD/JPY {usdJpy.toFixed(2)}</span>
                <span style={{ color: C.muted }}>外貨合計 ${USD_SUM.toLocaleString("en-US",{minimumFractionDigits:2})} ≈ <strong style={{color: C.text}}>{fmt(usdJpySum)}</strong></span>
              </>
            : <span style={{ color: C.amber, fontWeight: 600 }}>⚠️ レート取得失敗（オフラインまたは制限）</span>
          }
        </div>
      </div>

      {/* ── タブバー ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto", paddingBottom: 4 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: t===tab ? C.acc : C.card,
            border: `1px solid ${t===tab ? C.acc : C.line}`,
            color: t===tab ? "#fff" : C.muted,
            borderRadius: 10, padding: "8px 14px", fontSize: 13,
            cursor: "pointer", whiteSpace: "nowrap",
            fontWeight: 600,
            boxShadow: t===tab ? "none" : "0 2px 4px rgba(0,0,0,0.02)",
            transition: "all .2s"
          }}>{TAB_LB[t]}</button>
        ))}
      </div>

      {/* ══════════════════════════════════ */}
      {/* TAB: サマリー                      */}
      {/* ══════════════════════════════════ */}
      {tab === "summary" && (
        <div>
          {/* ミニカードグリッド */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 10, marginBottom: 16 }}>
            {[
              { label:"証券（含み益）",    value:fmt(RF_TOTAL),              sub:`+${fmt(RF_PNL)}`,          clr:C.acc   },
              { label:"現金・預金",        value:fmt(BANK_TOTAL),            sub:"SMBC/UFJ/住信SBI",          clr:"#0284c7" },
              { label:"保険・年金合計",    value:fmt(SONY_TOTAL + jaTotal),  sub:"ソニー生命＋JA共済",        clr:"#10b981" },
              { label:"iDeCo（評価益）",  value:fmt(IDECO_TOTAL),           sub:`+${fmt(IDECO_PNL)}`,       clr:C.purple  },
            ].map(({ label, value, sub, clr }) => (
              <div key={label} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "14px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 500 }}>{label}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: clr, fontFamily: "monospace" }}>{value}</div>
                <div style={{ fontSize: 11, color: sub.startsWith("+") ? C.green : C.muted, marginTop: 4, fontWeight: 600 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* 含み益 ハイライトカード */}
          <div style={{
            background: isDark ? "#0d2030" : "#eff6ff", border: `1px solid ${isDark ? "#1e3a5f" : "#bfdbfe"}`, borderRadius: 14,
            padding: "14px 18px", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>投資資産 総含み益</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.green, marginTop: 2 }}>+{fmt(invPnl)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: C.muted }}>投資元本合計</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginTop: 2, fontFamily: "monospace" }}>{fmt(invCost)}</div>
              <div style={{ fontSize: 12, color: C.green, fontWeight: 700, marginTop: 2 }}>利回り +{(invPnl / invCost * 100).toFixed(1)}%</div>
            </div>
          </div>

          {/* 円グラフセクション */}
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>資産配分</div>
            <ResponsiveContainer width="100%" height={190}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginTop: 12, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
              {pieData.map(d => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color, flexShrink: 0 }}/>
                  <span style={{ color: C.muted, fontWeight: 500 }}>{d.name}</span>
                  <span style={{ color: C.text, fontWeight: 700, fontFamily: "monospace" }}>{fmt(d.value)}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: C.muted, lineHeight: 1.4 }}>
              ※ 債券・外貨・他 = 国内債券¥3M＋米ドル資産＋証券口座内現金（MT集計から逆算）
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════ */}
      {/* TAB: 投資収益                      */}
      {/* ══════════════════════════════════ */}
      {tab === "pnl" && (
        <div>
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "16px", marginBottom: 16, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>元本 vs 評価額（元本追跡可能な資産）</div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr>
                    <Th>区分</Th>
                    <Th right>投資元本</Th>
                    <Th right>評価額</Th>
                    <Th right>含み損益</Th>
                    <Th right>利回り</Th>
                  </tr>
                </thead>
                <tbody>
                  {pnlRows.map(r => {
                    const gain = r.value - r.cost;
                    const rPct = (gain / r.cost * 100).toFixed(1);
                    return (
                      <tr key={r.label} style={{ borderBottom: `1px solid ${C.line}` }}>
                        <td style={{ padding: "10px 8px", fontSize: 13, color: r.color, fontWeight: 700 }}>
                          {r.label}
                          {r.note && <div style={{ fontSize: 10, color: C.muted, fontWeight: 400, marginTop: 2 }}>{r.note}</div>}
                        </td>
                        <td style={{ padding: "10px 8px", fontSize: 13, textAlign: "right", color: C.muted, fontFamily: "monospace" }}>{fmt(r.cost)}</td>
                        <td style={{ padding: "10px 8px", fontSize: 13, textAlign: "right", fontWeight: 600, fontFamily: "monospace" }}>{fmt(r.value)}</td>
                        <td style={{ padding: "10px 8px", fontSize: 13, textAlign: "right", color: pnlClr(gain), fontWeight: 700, fontFamily: "monospace" }}>{sgn(gain)}{fmt(Math.abs(gain))}</td>
                        <td style={{ padding: "10px 8px", fontSize: 12, textAlign: "right", color: pnlClr(gain), fontWeight: 700, fontFamily: "monospace" }}>{sgn(gain)}{rPct}%</td>
                      </tr>
                    );
                  })}
                  {/* 合計行 */}
                  <tr style={{ borderTop: `2px solid ${C.acc}`, fontWeight: 700, background: isDark ? "#16253b" : "#f8fafc" }}>
                    <td style={{ padding: "12px 8px", fontSize: 13, color: C.acc }}>▶ 投資合計</td>
                    <td style={{ padding: "12px 8px", fontSize: 13, textAlign: "right", color: C.muted, fontFamily: "monospace" }}>{fmt(invCost)}</td>
                    <td style={{ padding: "12px 8px", fontSize: 13, textAlign: "right", fontFamily: "monospace" }}>{fmt(invValue)}</td>
                    <td style={{ padding: "12px 8px", fontSize: 13, textAlign: "right", color: pnlClr(invPnl), fontFamily: "monospace" }}>{sgn(invPnl)}{fmt(Math.abs(invPnl))}</td>
                    <td style={{ padding: "12px 8px", fontSize: 12, textAlign: "right", color: pnlClr(invPnl), fontFamily: "monospace" }}>{sgn(invPnl)}{(invPnl / invCost * 100).toFixed(1)}%</td>
                  </tr>
                  {/* 参考データ */}
                  {[
                    { label:"現金・預金（参考）",  value:BANK_TOTAL },
                    { label:"債券・外貨・他（参考）", value:pieMisc },
                  ].map(r => (
                    <tr key={r.label} style={{ borderBottom: `1px solid ${C.line}` }}>
                      <td style={{ padding: "8px 8px", fontSize: 12, color: C.muted }}>{r.label}</td>
                      <td style={{ padding: "8px 8px", fontSize: 12, textAlign: "right", color: C.muted }}>─</td>
                      <td style={{ padding: "8px 8px", fontSize: 12, textAlign: "right", color: C.muted, fontFamily: "monospace" }}>{fmt(r.value)}</td>
                      <td style={{ padding: "8px 8px", fontSize: 12, textAlign: "right", color: C.muted }}>─</td>
                      <td style={{ padding: "8px 8px", fontSize: 12, textAlign: "right", color: C.muted }}>─</td>
                    </tr>
                  ))}
                  {/* 総合計 */}
                  <tr style={{ borderTop: `2px solid ${C.text}`, fontWeight: 700, background: isDark ? "#0f2e1b" : "#f0fdf4" }}>
                    <td style={{ padding: "12px 8px", fontSize: 13, color: C.text }}>総資産合計</td>
                    <td style={{ padding: "12px 8px", fontSize: 13, textAlign: "right", color: C.muted }}>─</td>
                    <td style={{ padding: "12px 8px", fontSize: 13, textAlign: "right", color: C.green, fontFamily: "monospace", fontSize: 14 }}>{fmt(GRAND_TOTAL)}</td>
                    <td colSpan={2} style={{ padding: "12px 8px", fontSize: 12, textAlign: "right", color: C.muted, fontWeight: 600 }}>
                      最終更新データ基準
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12, padding: "10px 14px", background: isDark ? "#0f2e1b" : "#f0fdf4", borderRadius: 10, border: `1px solid ${isDark ? "#14532d" : "#bbf7d0"}` }}>
              <div style={{ fontSize: 12, color: C.green, fontWeight: 700 }}>
                総合含み益 {sgn(invPnl)}{fmt(invPnl)} ／ 投資利回り {sgn(invPnl)}{(invPnl / invCost * 100).toFixed(1)}%
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 1.4 }}>
                ※ 証券コスト = 評価額−含み益（Robofolio取得値）｜ iDeCo = MF取得価額 ｜ JA = 複利積立計算値
              </div>
            </div>
          </div>

          {/* 名義別サマリー */}
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>証券 名義別サマリー</div>
            {["本人","妻","長女","次女","長男"].map(owner => {
              const items = RF_ITEMS.filter(i => i.owner === owner);
              if (!items.length) return null;
              const tot = items.reduce((s, i) => s + i.amount, 0);
              const pnl = items.reduce((s, i) => s + i.pnl,    0);
              const cst = tot - pnl;
              return (
                <div key={owner} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 0", borderBottom: `1px solid ${C.line}`,
                }}>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{owner}</span>
                    <span style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>{items[0].acc} · {items.length}銘柄</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "monospace" }}>{fmt(tot)}</div>
                    <div style={{ fontSize: 12, color: pnlClr(pnl), fontWeight: 600, marginTop: 2, fontFamily: "monospace" }}>
                      {sgn(pnl)}{fmt(pnl)} ({sgn(pnl)}{(pnl/cst*100).toFixed(1)}%)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════ */}
      {/* TAB: 証券銘柄                      */}
      {/* ══════════════════════════════════ */}
      {tab === "securities" && (
        <div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, background: C.card, padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.line}`, fontWeight: 500 }}>
            Robofolio（SBI本人/妻 + 日興子供3名）｜ 合計 {fmt(RF_TOTAL)} 含み益
            <span style={{ color: C.green, fontWeight: 700 }}> +{fmt(RF_PNL)}</span>
          </div>
          {["本人","妻","長女","次女","長男"].map(owner => {
            const items = RF_ITEMS.filter(i => i.owner === owner);
            if (!items.length) return null;
            const tot = items.reduce((s, i) => s + i.amount, 0);
            const pnl = items.reduce((s, i) => s + i.pnl,    0);
            return (
              <div key={owner} style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.line}`, padding: "14px", marginBottom: 16, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                <SecHead title={`${owner}（${items[0].acc}）`} total={tot} cost={tot-pnl} pnl={pnl}/>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>
                        <Th>銘柄</Th>
                        <Th>区分</Th>
                        <Th right>平均取得単価</Th>
                        <Th right>保有数量</Th>
                        <Th right>最新単価</Th>
                        <Th right>評価額</Th>
                        <Th right>含み損益</Th>
                        <Th right>配当利回り</Th>
                        <Th right>配当月</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${C.line}` }}>
                          <td style={{ padding: "10px 8px", color: C.text, fontWeight: 600, whiteSpace: "nowrap" }}>{it.name}</td>
                          <td style={{ padding: "10px 8px", color: C.muted, fontSize: 11, whiteSpace: "nowrap" }}>{it.sub}</td>
                          <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                            {typeof it.costPrice === "number" ? it.costPrice.toLocaleString("ja-JP", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : it.costPrice}
                          </td>
                          <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                            {typeof it.qty === "number" ? it.qty.toLocaleString("ja-JP") : it.qty}
                          </td>
                          <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "monospace", whiteSpace: "nowrap" }}>
                            {typeof it.price === "number" ? it.price.toLocaleString("ja-JP") : it.price}
                          </td>
                          <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(it.amount)}</td>
                          <td style={{ padding: "10px 8px", textAlign: "right", color: pnlClr(it.pnl), fontSize: 12, fontWeight: 700, fontFamily: "monospace", whiteSpace: "nowrap" }}>
                            {it.pnl >= 0 ? "+" : ""}{fmt(it.pnl)}
                          </td>
                          <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "monospace", color: C.muted, whiteSpace: "nowrap" }}>{it.divYield}</td>
                          <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "monospace", color: C.muted, whiteSpace: "nowrap" }}>{it.divMonth}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TAB: 銀行/外貨 ── */}
      {tab === "banks" && (
        <div>
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.line}`, padding: "14px", marginBottom: 16, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <SecHead title="銀行・現金口座合計（円）" total={BANK_TOTAL}/>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr><Th>口座</Th><Th>名義</Th><Th right>残高</Th><Th>取得元</Th></tr>
              </thead>
              <tbody>
                {BANK_ITEMS.map((it, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: "8px", color: C.text, fontWeight: 500 }}>{it.name}</td>
                    <td style={{ padding: "8px", color: C.muted }}>{it.owner}</td>
                    <td style={{ padding: "8px", textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>{fmt(it.amount)}</td>
                    <td style={{ padding: "8px" }}><Tag src={it.src}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, borderBottom: `1px solid ${C.line}`, paddingBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>💵 米ドル資産（MoneyTree集計内）</div>
              <div style={{ fontSize: 12 }}>
                {usdLoad
                  ? <span style={{ color: C.muted }}>取得中…</span>
                  : usdJpy
                  ? <span style={{ color: C.green, fontWeight: 700 }}>1 USD = ¥{usdJpy.toFixed(2)}</span>
                  : <span style={{ color: C.amber }}>レート取得失敗</span>}
              </div>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr><Th>名称</Th><Th>名義</Th><Th right>USD残高</Th><Th right>円換算</Th></tr>
              </thead>
              <tbody>
                {USD_ITEMS.map((it, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: "8px", color: C.text, fontWeight: 500 }}>{it.name}</td>
                    <td style={{ padding: "8px", color: C.muted, fontSize: 12 }}>{it.owner}</td>
                    <td style={{ padding: "8px", textAlign: "right", color: C.amber, fontWeight: 700, fontFamily: "monospace" }}>
                      ${it.usd.toLocaleString("en-US", { minimumFractionDigits:2 })}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>
                      {usdJpy ? fmt(Math.round(it.usd * usdJpy)) : "─"}
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: `2px solid ${C.line}`, fontWeight: 700, background: isDark ? "#16253b" : "#f8fafc" }}>
                  <td colSpan={2} style={{ padding: "10px 8px", fontSize: 13 }}>合計</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: C.amber, fontFamily: "monospace" }}>
                    ${USD_SUM.toLocaleString("en-US", { minimumFractionDigits:2 })}
                  </td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: C.text, fontFamily: "monospace" }}>
                    {usdJpy ? fmt(usdJpySum) : "─"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: 保険/年金 ── */}
      {tab === "insurance" && (
        <div>
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.line}`, padding: "14px", marginBottom: 16, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <SecHead title="ソニー生命（解約返戻金）" total={SONY_TOTAL} cost={SONY_COST} pnl={SONY_PNL}/>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr><Th>契約</Th><Th>証券番号</Th><Th right>解約返戻金</Th><Th right>払込保険料</Th><Th right>損益</Th></tr>
              </thead>
              <tbody>
                {SONY_ITEMS.map(it => {
                  const gain = it.amount - it.cost;
                  return (
                    <tr key={it.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                      <td style={{ padding: "8px", color: C.text, fontWeight: 500 }}>{it.name} <Tag src="SL"/></td>
                      <td style={{ padding: "8px", color: C.muted, fontSize: 11 }}>{it.certNo}</td>
                      <td style={{ padding: "8px", textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>{fmt(it.amount)}</td>
                      <td style={{ padding: "8px", textAlign: "right", color: C.muted, fontFamily: "monospace" }}>{fmt(it.cost)}</td>
                      <td style={{ padding: "8px", textAlign: "right", color: pnlClr(gain), fontSize: 12, fontWeight: 700, fontFamily: "monospace" }}>{sgn(gain)}{fmt(gain)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.line}`, padding: "14px", marginBottom: 16, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <SecHead title="iDeCo（SBI確定拠出年金）" total={IDECO_TOTAL} cost={IDECO_COST} pnl={IDECO_PNL}/>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    <Th>銘柄</Th>
                    <Th right>平均取得単価</Th>
                    <Th right>保有数量</Th>
                    <Th right>最新単価</Th>
                    <Th right>取得価額</Th>
                    <Th right>現在価値</Th>
                    <Th right>含み益</Th>
                    <Th right>配当利回り</Th>
                    <Th right>配当月</Th>
                  </tr>
                </thead>
                <tbody>
                  {IDECO_ITEMS.map((it, i) => (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.line}` }}>
                      <td style={{ padding: "10px 8px", color: C.text, fontWeight: 600, whiteSpace: "nowrap" }}>{it.name} <Tag src="MF"/></td>
                      <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "monospace", color: C.muted }}>{it.costPrice}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "monospace", color: C.muted }}>{it.qty}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "monospace", color: C.muted }}>{it.price}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right", color: C.muted, fontFamily: "monospace", whiteSpace: "nowrap" }}>{fmt(it.cost)}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(it.amount)}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right", color: pnlClr(it.pnl), fontSize: 12, fontWeight: 700, fontFamily: "monospace", whiteSpace: "nowrap" }}>+{fmt(it.pnl)}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "monospace", color: C.muted }}>{it.divYield}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "monospace", color: C.muted }}>{it.divMonth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* JA共済 */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "20px 0 12px", borderLeft: `4px solid #10b981`, paddingLeft: 12 }}>
            <div>
              <span style={{ color: C.text, fontWeight: 700, fontSize: 15 }}>JA共済（個人年金）</span>
              <span style={{ color: C.text, fontWeight: 600, fontSize: 14, marginLeft: 8 }}>{fmt(jaTotal)}</span>
              <span style={{ color: pnlClr(jaPnl), fontSize: 12, fontWeight: 700, marginLeft: 6 }}>
                {sgn(jaPnl)}{fmt(jaPnl)} ({sgn(jaPnl)}{jaCost > 0 ? (jaPnl/jaCost*100).toFixed(1) : 0}%)
              </span>
            </div>
            <button onClick={() => setAddMode(true)} style={{
              background: isDark ? "#14532d" : "#dcfce7", border: `1px solid ${isDark ? "#166534" : "#bbf7d0"}`, color: isDark ? "#34d399" : "#15803d",
              borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>＋追加</button>
          </div>

          {jaCalc.map(c => (
            <div key={c.id} style={{
              background: C.card, border: `1px solid ${editJa?.id===c.id ? C.acc : C.line}`,
              borderRadius: 16, padding: "16px", marginBottom: 12, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.02)"
            }}>
              {editJa?.id === c.id ? (
                <JaEditForm contract={editJa} onChange={setEditJa} onSave={() => saveJa(editJa)} onCancel={() => setEditJa(null)} />
              ) : (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#10b981" }}>{c.name}</span>
                      <Tag src="JA"/>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => setEditJa({ ...c })} style={{ background: isDark ? "#1e2d45" : "#f1f5f9", border: "none", color: C.text, borderRadius: 6, padding: "4px 10px", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>編集</button>
                      <button onClick={() => archiveJa(c.id)} style={{ background: isDark ? "#1e2d45" : "#f1f5f9", border: "none", color: C.muted, borderRadius: 6, padding: "4px 10px", fontSize: 12, cursor: "pointer" }}>
                        {c.archived ? "復元" : "アーカイブ"}
                      </button>
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 14px", fontSize: 12, marginBottom: 12, borderBottom: `1px solid ${C.line}`, paddingBottom: 12 }}>
                    {[
                      ["証券番号",   c.certNo],
                      ["契約者/受取人", `${c.holder} / ${c.beneficiary}`],
                      ["積立額",     `¥${c.monthlyPayment.toLocaleString()}/月`],
                      ["契約開始日", c.startDate],
                      ["積立月数",   `${c.months}ヶ月（${(c.months/12).toFixed(1)}年）`],
                      ["金利設定",   `${(c.rate1*100).toFixed(2)}%(前${c.rate1Years}年) → ${(c.rate2*100).toFixed(2)}%`],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <span style={{ color: C.muted }}>{k}: </span>
                        <span style={{ color: C.text, fontWeight: 500 }}>{v}</span>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, background: isDark ? "#16253b" : "#f8fafc", borderRadius: 10, padding: "10px", marginBottom: 12 }}>
                    {[
                      { label:"払込元本", value:fmt(c.cost),  color:C.muted },
                      { label:"計算評価額",       value:fmt(c.value), color:C.text },
                      { label:"含み益",           value:`${sgn(c.pnl)}${fmt(c.pnl)}`, color:pnlClr(c.pnl) },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>{label}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color, marginTop: 4, fontFamily: "monospace" }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background: isDark ? "#0d2030" : "#eff6ff", border: `1px solid ${isDark ? "#1e3a5f" : "#bfdbfe"}`, borderRadius: 10, padding: "10px 14px", marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: C.muted, marginBottom: 4, fontWeight: 600 }}>年金受取予定</div>
                    <div style={{ fontSize: 13, color: C.text, fontWeight: 500 }}>
                      {c.annuityStartYear}〜{c.annuityEndYear}年 ｜ 年額
                      <span style={{ color: C.acc, fontWeight: 700, marginLeft: 6 }}>{fmt(c.confirmedAnnualAmount)}/年</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 500 }}>
                      10年総額: <span style={{ color: C.text, fontWeight: 600 }}>{fmt(c.confirmedAnnualAmount * 10)}</span>
                      <span style={{ marginLeft:12 }}>最低保証: {fmt(c.minAnnualAmount * 10)}</span>
                    </div>
                  </div>

                  {c.notes && (
                    <pre style={{ fontSize: 11, color: C.muted, margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6, background: isDark ? "#16253b" : "#f8fafc", padding: "10px", borderRadius: 8, border: `1px solid ${C.line}` }}>
                      {c.notes}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── フッター ── */}
      <div style={{ marginTop: 24, fontSize: 11, color: C.muted, textAlign: "center", borderTop: `1px solid ${C.line}`, paddingTop: 16 }}>
        岡野ファミリー 資産管理 v3.0 ｜ {DATA_DATE}
      </div>
    </div>
  );
}

// ================================================================
// テーマカラー動的定義
// ================================================================
const getColors = (isDark) => ({
  bg: isDark ? "#0a0f1a" : "#f8fafc",
  card: isDark ? "#121c2e" : "#ffffff",
  line: isDark ? "#1e2d45" : "#e2e8f0",
  text: isDark ? "#e2e8f0" : "#0f172a",
  muted: isDark ? "#4a6080" : "#64748b",
  acc: "#0052cc",
  green: "#0284c7",
  amber: isDark ? "#f59e0b" : "#b45309",
  red: "#ea580c",
  purple: isDark ? "#a78bfa" : "#7c3aed",
});