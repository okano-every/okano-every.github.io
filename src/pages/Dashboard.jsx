import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

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
function calcJA(c, asOfDate) {
  const start = new Date(c.startDate);
  const now   = asOfDate || new Date();
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
// 【2026-06-30改修】以下、証券・銀行・外貨・iDeCo・ソニー生命の数値は
// public/data/assets_latest.json から実行時に fetch して反映する（build_assets_json.py が自動生成）。
let DATA_DATE = "読み込み中...";
const DASHBOARD_VERSION = "v3.1";

// ================================================================
// 日付フォーマット：全ページ共通でyyyy/mm/dd表示に統一するヘルパー
// ================================================================
function dataYear() {
  const m = String(DATA_DATE || "").match(/^(\d{4})/);
  return m ? Number(m[1]) : new Date().getFullYear();
}
function fmtDate(raw) {
  if (!raw) return "ー";
  let s = String(raw).trim();
  s = s.replace(/^\(|\)$/g, ""); // MoneyForward由来の "(06/27 21:24)" 形式の括弧を除去
  let m = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})/); // yyyy/mm/dd（時刻有無問わず）
  if (m) return `${m[1]}/${m[2].padStart(2, "0")}/${m[3].padStart(2, "0")}`;
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); // yyyy-mm-dd（カレンダー入力由来）
  if (m) return `${m[1]}/${m[2].padStart(2, "0")}/${m[3].padStart(2, "0")}`;
  m = s.match(/^(\d{1,2})\/(\d{1,2})/); // mm/dd（年なし。Robofolio/MoneyForward由来）→ DATA_DATEの年を補完
  if (m) return `${dataYear()}/${m[1].padStart(2, "0")}/${m[2].padStart(2, "0")}`;
  return s;
}

let RF_ITEMS = [];
let RF_TOTAL = 0;
let RF_PNL   = 0;
let RF_COST  = 0;

// 銀行口座
let BANK_ITEMS = [];
let BANK_TOTAL = 0;

// ドル建て資産
let USD_ITEMS = [];
let USD_SUM = 0;

// iDeCo
let IDECO_ITEMS = [];
let IDECO_TOTAL = 0;
let IDECO_COST  = 0;
let IDECO_PNL   = 0;

// ソニー生命
let SONY_ITEMS = [];
let SONY_TOTAL = 0;
let SONY_COST  = 0;
let SONY_PNL   = 0;

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

let MT_TOTAL  = 0;
let MF_UNIQUE = 0;
let IDECO_ADJ = 0;
let MF_BANK_LAST_UPDATE = null;
let MF_IDECO_LAST_UPDATE = null;

// assets_latest.json 取得完了時にモジュールスコープ変数を一括書き換え。取得失敗時は呼ばれず、直前の値を保持（可用性優先）。
function applyAssetsData(d) {
  DATA_DATE  = d.dataDate || DATA_DATE;

  RF_ITEMS = Array.isArray(d.rfItems) ? d.rfItems : [];
  RF_TOTAL = RF_ITEMS.reduce((s, i) => s + i.amount, 0);
  RF_PNL   = RF_ITEMS.reduce((s, i) => s + i.pnl,    0);
  RF_COST  = RF_TOTAL - RF_PNL;

  BANK_ITEMS = Array.isArray(d.bankItems) ? d.bankItems : [];
  BANK_TOTAL = BANK_ITEMS.reduce((s, i) => s + i.amount, 0);

  USD_ITEMS = Array.isArray(d.usdItems) ? d.usdItems : [];
  USD_SUM   = USD_ITEMS.reduce((s, i) => s + i.usd, 0);

  IDECO_ITEMS = Array.isArray(d.idecoItems) ? d.idecoItems : [];
  IDECO_TOTAL = IDECO_ITEMS.reduce((s, i) => s + i.amount, 0);
  IDECO_COST  = IDECO_ITEMS.reduce((s, i) => s + i.cost,   0);
  IDECO_PNL   = IDECO_ITEMS.reduce((s, i) => s + i.pnl,    0);

  SONY_ITEMS = Array.isArray(d.sonyItems) ? d.sonyItems : [];
  SONY_TOTAL = SONY_ITEMS.reduce((s, i) => s + i.amount, 0);
  SONY_COST  = SONY_ITEMS.reduce((s, i) => s + i.cost,   0);
  SONY_PNL   = SONY_TOTAL - SONY_COST;

  MT_TOTAL  = d.mtTotal  || 0;
  MF_UNIQUE = d.mfUnique || 0;
  IDECO_ADJ = d.idecoAdj || 0;
  MF_BANK_LAST_UPDATE  = d.mfBankLastUpdate  || null;
  MF_IDECO_LAST_UPDATE = d.mfIdecoLastUpdate || null;
}

const MISSING_LIST = [
  { name:"SCB タイバーツ口座",     status:"✓ 銀行/外貨タブに手入力欄を追加（総合資産には未加算）",  done:true },
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
  MANUAL: { bg: "#fef9c3", text: "#854d0e", label: "手入力" },
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
// 並び替え可能テーブルヘッダー（全タブ共通）
// 文字列＝50音/アルファベット昇降順、数値＝大小順、日付＝新旧順
// ================================================================
function SortTh({ label, sortKey, tableId, getSort, onSort, right, isDate }) {
  const { key, dir } = getSort(tableId);
  const active = key === sortKey;
  return (
    <th
      onClick={() => onSort(tableId, sortKey, isDate)}
      style={{
        textAlign: right ? "right" : "left", padding: "10px 8px", color: C.muted, fontWeight: 600,
        fontSize: 12, borderBottom: `2px solid ${C.line}`, whiteSpace: "nowrap", cursor: "pointer", userSelect: "none",
      }}
    >
      {label}
      <span style={{ marginLeft: 4, fontSize: 10, color: active ? C.acc : C.line }}>
        {active ? (dir === "asc" ? "▲" : "▼") : "▲▼"}
      </span>
    </th>
  );
}

// ================================================================
// 手入力資産（円・米ドル・タイバーツ）：localStorageで管理、履歴を保持
// 同名項目は最新日付のものをカードに反映し、過去分は履歴として保持
// ================================================================
const MANUAL_CASH_KEY = "okano-manual-cash-v1";
function loadManualCash() {
  try {
    const raw = localStorage.getItem(MANUAL_CASH_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveManualCash(list) {
  try {
    localStorage.setItem(MANUAL_CASH_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("手入力資産の保存に失敗しました", e);
  }
}
function latestManualByName(entries, currency) {
  const byName = {};
  entries.filter((e) => e.currency === currency).forEach((e) => {
    if (!byName[e.name] || e.date > byName[e.name].date) byName[e.name] = e;
  });
  return Object.values(byName);
}

function ManualCashForm({ currency, unitLabel, onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const fieldStyle = {
    width: "100%", background: "#ffffff", border: `1px solid ${C.line}`, color: "#0f172a",
    borderRadius: 8, padding: "8px 12px", fontSize: 13, boxSizing: "border-box", marginTop: 4,
  };
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: "14px 16px", marginTop: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>名称・口座名</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="例：自宅金庫" style={fieldStyle} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{unitLabel}</label>
          <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} style={fieldStyle} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>日付</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={fieldStyle} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>取得元</label>
          <div style={{ ...fieldStyle, color: C.muted, background: "#f8fafc" }}>手入力</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          onClick={() => { if (name.trim()) onSubmit({ currency, name: name.trim(), amount, date, source: "手入力" }); }}
          style={{ background: C.acc, border: "none", color: "#fff", borderRadius: 8, padding: "7px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          追加
        </button>
        <button onClick={onCancel} style={{ background: "#f1f5f9", border: "none", color: "#64748b", borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer" }}>
          キャンセル
        </button>
      </div>
    </div>
  );
}

function ManualHistoryRow({ name, currency, entries, unitFmt, onDelete }) {
  const [open, setOpen] = useState(false);
  const history = entries.filter((e) => e.currency === currency && e.name === name).sort((a, b) => b.date.localeCompare(a.date));
  if (history.length <= 1) return null;
  return (
    <div style={{ marginTop: 2 }}>
      <button onClick={() => setOpen((o) => !o)} style={{ background: "none", border: "none", color: C.acc, fontSize: 11, cursor: "pointer", padding: 0 }}>
        {open ? "履歴を閉じる ▲" : `履歴を見る（${history.length}件）▼`}
      </button>
      {open && (
        <div style={{ marginTop: 4, paddingLeft: 10, borderLeft: `2px solid ${C.line}` }}>
          {history.map((h) => (
            <div key={h.id} style={{ fontSize: 11, color: C.muted, display: "flex", justifyContent: "space-between", gap: 8, padding: "2px 0" }}>
              <span>{fmtDate(h.date)}</span>
              <span style={{ fontFamily: "monospace" }}>{unitFmt(h.amount)}</span>
              <button onClick={() => onDelete(h.id)} style={{ background: "none", border: "none", color: C.red, cursor: "pointer", fontSize: 11 }}>削除</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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
  summary:"📊 サマリー", pnl:"💹 投資損益", securities:"📈 証券銘柄",
  banks:"🏦 銀行/外貨", insurance:"🛡 保険/年金", missing:"⚠️ 未連携",
};

let C = getColors(false); // 初期値: ライトモード（レンダー前のundefined回避）

export default function Dashboard() {
  const [tab,     setTab]     = useState("summary");
  const [usdJpy,  setUsdJpy]  = useState(null);
  const [usdLoad, setUsdLoad] = useState(true);
  const [thbJpy,  setThbJpy]  = useState(null);
  const [thbIsFallback, setThbIsFallback] = useState(false);
  const [jaList,  setJaList]  = useState(INIT_JA);
  const [editJa,  setEditJa]  = useState(null);
  const [addMode, setAddMode] = useState(false);
  const [theme,   setTheme]   = useState("light");
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [assetsError,  setAssetsError]  = useState(false);
  const [historyRows,  setHistoryRows]  = useState([]);
  const [historyError, setHistoryError] = useState(false);
  const [detailHistoryRows, setDetailHistoryRows] = useState([]);
  const [detailHistoryError, setDetailHistoryError] = useState(false);
  const [trendRange, setTrendRange] = useState("month"); // "year" | "month" | "day"
  const [bankExclusions, setBankExclusions] = useState(() => {
    try { return JSON.parse(localStorage.getItem("okano-bank-exclusions-v1")) || {}; } catch { return {}; }
  });
  const [manualCash, setManualCash] = useState([]);
  const [manualFormOpen, setManualFormOpen] = useState(null); // 'JPY' | 'USD' | 'THB' | null
  const [sortState, setSortState] = useState({}); // { tableId: { key, dir } }

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

  // ── 並び替え（全タブ共通：文字列=50音/英字昇降順、数値=大小順、日付=新旧順） ──
  const getSort = (tableId) => sortState[tableId] || { key: null, dir: "asc" };
  const onSort = (tableId, key) => {
    setSortState((prev) => {
      const cur = prev[tableId] || { key: null, dir: "asc" };
      const dir = cur.key === key ? (cur.dir === "asc" ? "desc" : "asc") : "asc";
      return { ...prev, [tableId]: { key, dir } };
    });
  };
  const applySort = (rows, tableId, dateKeys = []) => {
    const { key, dir } = getSort(tableId);
    if (!key) return rows;
    const isDateKey = dateKeys.includes(key);
    const sorted = [...rows].sort((a, b) => {
      let cmp;
      if (isDateKey) {
        cmp = fmtDate(a[key]).localeCompare(fmtDate(b[key]));
      } else {
        const av = a[key], bv = b[key];
        if (typeof av === "number" || typeof bv === "number") {
          cmp = (Number(av) || 0) - (Number(bv) || 0);
        } else {
          cmp = String(av ?? "").localeCompare(String(bv ?? ""), "ja");
        }
      }
      return dir === "asc" ? cmp : -cmp;
    });
    return sorted;
  };

  useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then(r => r.json())
      .then(d => { setUsdJpy(d.rates?.JPY || null); setUsdLoad(false); })
      .catch(() => setUsdLoad(false));
  }, []);

  // タイバーツ：APIスクレイピング非対応のため手入力管理。レートは frankfurter.app のライブ取得（失敗時は仮レート1THB=4.15円）
  useEffect(() => {
    fetch("https://api.frankfurter.app/latest?from=THB&to=JPY")
      .then(r => { if (!r.ok) throw new Error("rate fetch failed"); return r.json(); })
      .then(d => {
        const rate = d.rates?.JPY;
        if (rate) { setThbJpy(rate); setThbIsFallback(false); }
        else { setThbJpy(4.15); setThbIsFallback(true); }
      })
      .catch(() => { setThbJpy(4.15); setThbIsFallback(true); });
  }, []);

  // 手入力資産（円・米ドル・タイバーツの「タンス預金」等）をlocalStorageから復元
  useEffect(() => {
    setManualCash(loadManualCash());
  }, []);
  const addManualCash = (entry) => {
    const next = [...manualCash, { ...entry, id: `MC-${Date.now()}` }];
    setManualCash(next);
    saveManualCash(next);
    setManualFormOpen(null);
  };
  const deleteManualCash = (id) => {
    const next = manualCash.filter((e) => e.id !== id);
    setManualCash(next);
    saveManualCash(next);
  };

  // 資産データ（証券・銀行・外貨・iDeCo・ソニー生命）を実行時に取得
  // build_assets_json.py が毎営業日 public/data/assets_latest.json を自動更新する
  useEffect(() => {
    fetch("/data/assets_latest.json")
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { applyAssetsData(d); setAssetsLoaded(true); })
      .catch(() => { setAssetsError(true); setAssetsLoaded(true); });
  }, []);

  // 資産推移グラフ用：asset_history.csvをJSON化したものを取得（build_assets_json.pyが毎回生成）
  useEffect(() => {
    fetch("/data/asset_history.json")
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(rows => setHistoryRows(Array.isArray(rows) ? rows : []))
      .catch(() => setHistoryError(true));
      
    fetch("/data/asset_history_detail.json")
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(rows => setDetailHistoryRows(Array.isArray(rows) ? rows : []))
      .catch(() => setDetailHistoryError(true));
  }, []);

  const jaActive = jaList.filter(c => !c.archived);
  const jaCalc   = jaActive.map(c => ({ ...c, ...calcJA(c) }));
  const jaTotal  = jaCalc.reduce((s, c) => s + c.value, 0);
  const jaCost   = jaCalc.reduce((s, c) => s + c.cost,  0);
  const jaPnl    = jaCalc.reduce((s, c) => s + c.pnl,   0);

  const excludedJpySum = BANK_ITEMS.filter(it => (bankExclusions || {})[it.name]).reduce((s, i) => s + i.amount, 0);
  const excludedUsdJpySum = USD_ITEMS.filter(it => (bankExclusions || {})[it.name]).reduce((s, i) => s + Math.round(i.usd * (usdJpy || 0)), 0);
  const GRAND_TOTAL = MT_TOTAL + MF_UNIQUE + SONY_TOTAL + IDECO_ADJ + jaTotal - excludedJpySum - excludedUsdJpySum;
  const EFFECTIVE_BANK_TOTAL = BANK_TOTAL - excludedJpySum;
  const EFFECTIVE_USD_SUM = USD_SUM - USD_ITEMS.filter(it => (bankExclusions || {})[it.name]).reduce((s, i) => s + i.usd, 0);
  const EFFECTIVE_USD_JPY_SUM = usdJpy ? Math.round(EFFECTIVE_USD_SUM * usdJpy) : 0;

  const pnlRows = [
    { label:"証券（SBI/日興）", cost:RF_COST,   value:RF_TOTAL,   color:C.acc },
    { label:"iDeCo",            cost:IDECO_COST, value:IDECO_TOTAL, color:C.purple, note:"MF取得価額使用" },
    { label:"ソニー生命",        cost:SONY_COST,  value:SONY_TOTAL,  color:"#f97316" },
    { label:"JA共済（計算値）",  cost:jaCost,     value:jaTotal,    color:"#10b981", note:"複利計算（0.9%→0.75%）" },
  ];
  const invCost  = pnlRows.reduce((s, r) => s + r.cost,  0);
  const invValue = pnlRows.reduce((s, r) => s + r.value, 0);
  const invPnl   = invValue - invCost;

  const pieMisc = Math.max(0, GRAND_TOTAL - EFFECTIVE_BANK_TOTAL - RF_TOTAL - IDECO_TOTAL - SONY_TOTAL - jaTotal);
  const pieBonds  = Math.max(0, pieMisc - EFFECTIVE_USD_JPY_SUM); // 「他」を含まず、外貨を差し引いた残差を「債券」として表示（主に国内債券・証券口座内現金）
  const pieData = [
    { name:"現金・預金（円）",  value:EFFECTIVE_BANK_TOTAL,  color:"#0284c7" },
    { name:"証券（投信/株）",  value:RF_TOTAL,    color:"#0052cc" },
    { name:"債券",                value:pieBonds,    color:"#6366f1" },
    { name:"外貨",                value:EFFECTIVE_USD_JPY_SUM,   color:"#f59e0b" },
    { name:"iDeCo",           value:IDECO_TOTAL, color:C.purple },
    { name:"ソニー生命",       value:SONY_TOTAL,  color:"#f97316" },
    { name:"JA共済",           value:jaTotal,     color:"#10b981" },
  ];

  // 資産推移データ加工：同一日付は最新行を採用して重複を集約し、日付昇順に並べ替え
  // JA共済は契約条件から任意の過去日付で計算可能なため（CSVに保存不要）、各日付でcalcJAを適用して遷及算出
  // 「総資産」はサマリータブのGRAND_TOTALと完全に同じ式（mt+mf+sony+idecoAdj+ja）で計算
  const historyByDate = new Map();
  historyRows.forEach(r => {
    const asOf = new Date(r.date);
    const jaAtDate = jaActive.reduce((s, c) => s + calcJA(c, asOf).value, 0);
    const mt = Number(r.mt_total) || 0;
    const mf = Number(r.mf_unique) || 0;
    const sony = Number(r.sony_total) || 0;
    const idecoAdjAtDate = r.ideco_adj !== undefined ? (Number(r.ideco_adj) || 0) : 0;
    historyByDate.set(r.date, {
      date: r.date,
      grand: mt + mf + sony + idecoAdjAtDate + jaAtDate,
      securities: Number(r.rf_securities) || 0,
      ideco: Number(r.ideco_total) || 0,
      bank: Number(r.bank_total) || 0,
      sony: sony,
      ja: jaAtDate,
      insurance: sony + jaAtDate,
    });
  });
  const trendData = Array.from(historyByDate.values()).sort((a, b) => a.date.localeCompare(b.date));
  const trendHasIdeco = trendData.some(d => d.ideco > 0);
  const trendHasBank  = trendData.some(d => d.bank  > 0);

  const saveJa    = (updated) => { setJaList(l => l.map(c => c.id===updated.id ? updated : c)); setEditJa(null); };
  const archiveJa = (id)      => setJaList(l => l.map(c => c.id===id ? { ...c, archived:!c.archived } : c));
  const addJa     = (c)       => { setJaList(l => [...l, c]); setAddMode(false); };
  const [secViewMode, setSecViewMode] = useState("trend"); // 有価資産セクション："trend"(推移) / "breakdown"(現在の銘柄別内訳)

  const Th = ({ children, right }) => (
    <th style={{ textAlign: right ? "right" : "left", padding: "10px 8px", color: C.muted, fontWeight: 600, fontSize: 12, borderBottom: `2px solid ${C.line}`, whiteSpace: "nowrap" }}>
      {children}
    </th>
  );

  const getFilteredTrend = (data, range) => {
    if (!data || data.length === 0) return [];
    const latestDate = new Date(data[data.length - 1].date);
    let cutoff = new Date(latestDate);
    if (range === "day") {
      cutoff.setFullYear(cutoff.getFullYear() - 1);
    } else if (range === "month") {
      cutoff.setFullYear(cutoff.getFullYear() - 3);
    } else {
      cutoff = new Date(0);
    }
    let filtered = data.filter(d => new Date(d.date) >= cutoff);
    if (range === "month" || range === "year") {
      const byMonth = new Map();
      filtered.forEach(d => {
        const ym = d.date.substring(0, 7);
        byMonth.set(ym, d);
      });
      filtered = Array.from(byMonth.values());
    }
    return filtered;
  };

  const filteredTrendData = getFilteredTrend(trendData, trendRange);
  const filteredDetailData = getFilteredTrend(detailHistoryRows, trendRange);

  // 詳細データの再構成（銘柄・口座ごとの推移を簡単に描画できるように）
  // 形式: [ { date: "YYYY-MM-DD", "eMAXIS Slim...": 100000, "SBI証券...": 50000 }, ... ]
  const detailChartData = filteredDetailData.map(d => {
    const row = { date: d.date };
    if (d.securities) d.securities.forEach(s => row[`[証券] ${s.name} (${s.owner})`] = s.amount);
    if (d.ideco)      d.ideco.forEach(s => row[`[iDeCo] ${s.name}`] = s.amount);
    if (d.bank)       d.bank.forEach(s => row[`[銀行] ${s.name}`] = s.amount);
    if (d.sony)       d.sony.forEach(s => row[`[保険] ${s.name}`] = s.amount);
    return row;
  });

  const getLineKeys = (prefix) => {
    const keys = new Set();
    detailChartData.forEach(d => {
      Object.keys(d).forEach(k => {
        if (k.startsWith(prefix)) keys.add(k);
      });
    });
    return Array.from(keys);
  };

  if (!assetsLoaded) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 14, color: C.muted, fontWeight: 600 }}>資産データを読み込んでいます…</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.text, fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", padding: 16, transition: "background 0.3s, color 0.3s" }}>

      {assetsError && (
        <div style={{ background: isDark ? "#3f1d1d" : "#fef2f2", border: `1px solid ${isDark ? "#7f1d1d" : "#fecaca"}`, color: isDark ? "#fca5a5" : "#b91c1c", borderRadius: 12, padding: "10px 14px", marginBottom: 12, fontSize: 12, fontWeight: 600 }}>
          ⚠️ 最新の資産データ取得に失敗しました（assets_latest.json）。表示中の数値が古い可能性があります。
        </div>
      )}

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
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <button
            onClick={() => window.history.back()}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "6px 12px", borderRadius: 8, flexShrink: 0,
              border: `1px solid ${C.line}`, background: C.bg,
              fontSize: 12, color: C.muted, cursor: "pointer",
              fontWeight: 600, transition: "all 0.2s", marginTop: 2
            }}
          >
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
              { label:"証券（含み益）",    value:fmt(RF_TOTAL),              sub:`+${fmt(RF_PNL)}`,          clr:C.acc,     tab:"securities" },
              { label:"現金・預金",        value:fmt(BANK_TOTAL),            sub:"SMBC/UFJ/住信SBI",          clr:"#0284c7", tab:"banks" },
              { label:"保険・年金合計",    value:fmt(SONY_TOTAL + jaTotal),  sub:"ソニー生命＋JA共済",        clr:"#10b981", tab:"insurance" },
              { label:"iDeCo（評価益）",  value:fmt(IDECO_TOTAL),           sub:`+${fmt(IDECO_PNL)}`,       clr:C.purple,  tab:"insurance" },
              { label:"債券",            value:fmt(pieBonds),               sub:"国内債券・証券口座内現金等",    clr:"#6366f1", tab:"banks" },
              { label:"外貨",            value:fmt(usdJpySum),              sub:"$" + USD_SUM.toLocaleString("en-US",{minimumFractionDigits:2}), clr:"#f59e0b", tab:"banks" },
            ].map(({ label, value, sub, clr, tab: targetTab }) => (
              <div key={label} onClick={() => setTab(targetTab)} style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: "14px", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", cursor: "pointer", transition: "transform .15s, box-shadow .15s" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 10px -3px rgba(0,0,0,0.12)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)"; }}
              >
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
                <Tooltip formatter={(v) => fmt(v)} labelFormatter={fmtDate} />
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
              ※ 債券 = 国内債券＋証券口座内現金等（MT集計から逆算）　※ 外貨 = 米ドル建資産（ライブレート換算）
            </div>
          </div>

          {/* ── 資産推移（サマリー下部） ── */}
          <div style={{ marginTop: 32, paddingTop: 24, borderTop: `2px dashed ${C.line}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>📉 資産推移</div>
              <div style={{ display: "flex", background: isDark ? "#1e2d45" : "#f1f5f9", borderRadius: 8, padding: 2, gap: 2 }}>
                <button onClick={() => setTrendRange("year")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, border: "none", cursor: "pointer", background: trendRange==="year" ? C.acc : "transparent", color: trendRange==="year" ? "#fff" : C.muted, fontWeight: 600 }}>年次(全て)</button>
                <button onClick={() => setTrendRange("month")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, border: "none", cursor: "pointer", background: trendRange==="month" ? C.acc : "transparent", color: trendRange==="month" ? "#fff" : C.muted, fontWeight: 600 }}>月次(3年)</button>
                <button onClick={() => setTrendRange("day")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, border: "none", cursor: "pointer", background: trendRange==="day" ? C.acc : "transparent", color: trendRange==="day" ? "#fff" : C.muted, fontWeight: 600 }}>日次(12月)</button>
              </div>
            </div>
            
            {historyError && (
              <div style={{ background: isDark ? "#3f1d1d" : "#fef2f2", border: `1px solid ${isDark ? "#7f1d1d" : "#fecaca"}`, color: isDark ? "#fca5a5" : "#b91c1c", borderRadius: 12, padding: "10px 14px", marginBottom: 12, fontSize: 12, fontWeight: 600 }}>
                ⚠️ 資産推移データの取得に失敗しました。
              </div>
            )}

            {filteredTrendData.length === 0 ? (
              <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "24px", textAlign: "center", color: C.muted, fontSize: 13 }}>
                推移データがありません。
              </div>
            ) : (
              <>
                {/* — 一番上：総合資産の推移 — */}
                <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "16px", marginBottom: 20, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>📊 総合資産の推移</div>
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={filteredTrendData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.muted }} tickFormatter={fmtDate} />
                      <YAxis tick={{ fontSize: 10, fill: C.muted }} tickFormatter={(v) => `${Math.round(v / 10000)}万`} width={50} />
                      <Tooltip formatter={(v) => fmt(v)} labelFormatter={fmtDate} />
                      <Line type="monotone" dataKey="grand" name="総資産" stroke={C.acc} strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* — 分類別：有価資産 — */}
                <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "16px", marginBottom: 16, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>📈 有価資産</div>
                    <div style={{ display: "flex", background: isDark ? "#1e2d45" : "#f1f5f9", borderRadius: 8, padding: 2, gap: 2 }}>
                      <button onClick={() => setSecViewMode("trend")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, border: "none", cursor: "pointer", background: secViewMode==="trend" ? C.acc : "transparent", color: secViewMode==="trend" ? "#fff" : C.muted, fontWeight: 600 }}>合計推移</button>
                      <button onClick={() => setSecViewMode("detail")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, border: "none", cursor: "pointer", background: secViewMode==="detail" ? C.acc : "transparent", color: secViewMode==="detail" ? "#fff" : C.muted, fontWeight: 600 }}>銘柄別推移</button>
                      <button onClick={() => setSecViewMode("breakdown")} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 11, border: "none", cursor: "pointer", background: secViewMode==="breakdown" ? C.acc : "transparent", color: secViewMode==="breakdown" ? "#fff" : C.muted, fontWeight: 600 }}>銘柄別内訳</button>
                    </div>
                  </div>
                  {secViewMode === "trend" ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={filteredTrendData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.muted }} />
                        <YAxis tick={{ fontSize: 10, fill: C.muted }} tickFormatter={(v) => `${Math.round(v / 10000)}万`} width={50} />
                        <Tooltip formatter={(v) => fmt(v)} />
                        <Line type="monotone" dataKey="securities" name="有価資産" stroke="#0052cc" strokeWidth={2.5} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : secViewMode === "detail" ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={detailChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.muted }} />
                        <YAxis tick={{ fontSize: 10, fill: C.muted }} tickFormatter={(v) => `${Math.round(v / 10000)}万`} width={50} />
                        <Tooltip formatter={(v) => fmt(v)} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        {getLineKeys("[証券]").map((k, i) => <Line key={k} type="monotone" dataKey={k} name={k.replace("[証券] ", "")} stroke={["#0052cc", "#0284c7", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#f43f5e", "#14b8a6"][i%8]} strokeWidth={1.5} dot={{ r: 1 }} />)}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div>
                      <div style={{ fontSize: 11, color: C.muted, marginBottom: 10 }}>※ 現時点（{DATA_DATE}）の内訳</div>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr>
                            <SortTh label="銘柄" sortKey="name" tableId="trend_breakdown" getSort={getSort} onSort={onSort} />
                            <SortTh label="名義" sortKey="owner" tableId="trend_breakdown" getSort={getSort} onSort={onSort} />
                            <SortTh label="評価額" sortKey="amount" tableId="trend_breakdown" getSort={getSort} onSort={onSort} right />
                          </tr>
                        </thead>
                        <tbody>
                          {(getSort("trend_breakdown").key ? applySort(RF_ITEMS, "trend_breakdown") : [...RF_ITEMS].sort((a, b) => b.amount - a.amount)).map((it, i) => (
                            <tr key={i} style={{ borderBottom: `1px solid ${C.line}` }}>
                              <td style={{ padding: "8px", color: C.text, fontWeight: 500 }}>{it.name}</td>
                              <td style={{ padding: "8px", color: C.muted, fontSize: 11 }}>{it.owner}</td>
                              <td style={{ padding: "8px", textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>{fmt(it.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* — 分類別：iDeCo — */}
                <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "16px", marginBottom: 16, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🛡 iDeCo</div>
                  {trendHasIdeco ? (
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={detailChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.muted }} />
                        <YAxis tick={{ fontSize: 10, fill: C.muted }} tickFormatter={(v) => `${Math.round(v / 10000)}万`} width={50} />
                        <Tooltip formatter={(v) => fmt(v)} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        {getLineKeys("[iDeCo]").map((k, i) => <Line key={k} type="monotone" dataKey={k} name={k.replace("[iDeCo] ", "")} stroke={["#8b5cf6", "#a855f7", "#d946ef", "#ec4899"][i%4]} strokeWidth={2} dot={{ r: 2 }} />)}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: "20px 0" }}>iDeCoデータなし</div>
                  )}
                </div>

                {/* — 分類別：現金 — */}
                <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "16px", marginBottom: 16, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🏦 現金</div>
                  {trendHasBank ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={detailChartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.muted }} />
                        <YAxis tick={{ fontSize: 10, fill: C.muted }} tickFormatter={(v) => `${Math.round(v / 10000)}万`} width={50} />
                        <Tooltip formatter={(v) => fmt(v)} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        {getLineKeys("[銀行]").map((k, i) => <Line key={k} type="monotone" dataKey={k} name={k.replace("[銀行] ", "")} stroke={["#0284c7", "#0ea5e9", "#38bdf8", "#0369a1"][i%4]} strokeWidth={2} dot={{ r: 2 }} />)}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div style={{ fontSize: 12, color: C.muted, textAlign: "center", padding: "20px 0" }}>現金データなし</div>
                  )}
                </div>

                {/* — 分類別：保険年金 — */}
                <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "16px", marginBottom: 16, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>💰 保険年金（ソニー生命＋JA共済）</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={filteredTrendData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                      <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.muted }} />
                      <YAxis tick={{ fontSize: 10, fill: C.muted }} tickFormatter={(v) => `${Math.round(v / 10000)}万`} width={50} />
                      <Tooltip formatter={(v) => fmt(v)} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey="insurance" name="保険年金合計" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="sony" name="ソニー生命のみ" stroke="#f97316" strokeWidth={1.5} dot={{ r: 2 }} strokeDasharray="4 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
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
                    { label:"債券（参考）", value:pieBonds },
                    { label:"外貨（参考）", value:usdJpySum },
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
                    <td style={{ padding: "12px 8px", fontSize: 14, textAlign: "right", color: C.green, fontFamily: "monospace" }}>{fmt(GRAND_TOTAL)}</td>
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
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 16, background: C.card, padding: "16px 20px", borderRadius: 12, border: `1px solid ${C.line}`, fontWeight: 500, display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.text, fontFamily: "monospace" }}>{fmt(RF_TOTAL)}</div>
            <div style={{ fontSize: 13, color: C.muted }}>
              含み損益: <span style={{ color: pnlClr(RF_PNL), fontWeight: 700 }}>{sgn(RF_PNL)}{fmt(Math.abs(RF_PNL))}</span>
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              抽出先：Robofolio
            </div>
          </div>
          {["本人","妻","長女","次女","長男"].map(owner => {
            const rawItems = RF_ITEMS.filter(i => i.owner === owner);
            if (!rawItems.length) return null;
            const tableId = `sec_${owner}`;
            const items = applySort(rawItems, tableId);
            const tot = rawItems.reduce((s, i) => s + i.amount, 0);
            const pnl = rawItems.reduce((s, i) => s + i.pnl,    0);
            return (
              <div key={owner} style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.line}`, padding: "14px", marginBottom: 16, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                <SecHead title={`${owner}（${rawItems[0].acc}）`} total={tot} cost={tot-pnl} pnl={pnl}/>
                {rawItems[0].lastUpdate && (
                  <div style={{ fontSize: 11, color: C.muted, marginBottom: 8, marginTop: -4 }}>取得日時: {fmtDate(rawItems[0].lastUpdate)}</div>
                )}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>
                        <SortTh label="銘柄" sortKey="name" tableId={tableId} getSort={getSort} onSort={onSort} />
                        <SortTh label="区分" sortKey="sub" tableId={tableId} getSort={getSort} onSort={onSort} />
                        <SortTh label="平均取得単価" sortKey="costPrice" tableId={tableId} getSort={getSort} onSort={onSort} right />
                        <SortTh label="保有数量" sortKey="qty" tableId={tableId} getSort={getSort} onSort={onSort} right />
                        <SortTh label="最新単価" sortKey="price" tableId={tableId} getSort={getSort} onSort={onSort} right />
                        <SortTh label="評価額" sortKey="amount" tableId={tableId} getSort={getSort} onSort={onSort} right />
                        <SortTh label="含み損益" sortKey="pnl" tableId={tableId} getSort={getSort} onSort={onSort} right />
                        <Th right>配当利回り</Th>
                        <Th right>配当月</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid ${C.line}` }}>
                          <td style={{ padding: "10px 8px", color: C.text, fontWeight: 600, whiteSpace: "normal", wordBreak: "break-all", minWidth: 100 }}>{it.name}</td>
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
      {tab === "banks" && (() => {
        const manualJpy = latestManualByName(manualCash, "JPY");
        const manualUsd = latestManualByName(manualCash, "USD");
        const manualThb = latestManualByName(manualCash, "THB");
        const jpyRows = applySort(
          [...BANK_ITEMS.map(it => ({ ...it, src: it.src || "MT" })), ...manualJpy.map(e => ({ name: e.name, amount: e.amount, lastUpdate: e.date, src: "MANUAL" }))],
          "bank_jpy", ["lastUpdate"]
        );
        const jpyTotal = jpyRows.filter(r => !(bankExclusions || {})[r.name]).reduce((s, r) => s + Number(r.amount || 0), 0);

        const usdRows = applySort(
          [...USD_ITEMS.map(it => ({ ...it, src: it.src || "MT" })), ...manualUsd.map(e => ({ name: e.name, usd: e.amount, lastUpdate: e.date, src: "MANUAL" }))],
          "bank_usd", ["lastUpdate"]
        );
        const usdRowsTotal = usdRows.filter(r => !(bankExclusions || {})[r.name]).reduce((s, r) => s + Number(r.usd || 0), 0);

        const thbRows = applySort(
          manualThb.map(e => ({ name: e.name, thb: e.amount, lastUpdate: e.date, src: "MANUAL" })),
          "bank_thb", ["lastUpdate"]
        );
        const thbRowsTotal = thbRows.filter(r => !(bankExclusions || {})[r.name]).reduce((s, r) => s + Number(r.thb || 0), 0);

        const toggleExclusion = (name) => {
          setBankExclusions(prev => {
            const next = { ...prev, [name]: !prev[name] };
            localStorage.setItem("okano-bank-exclusions-v1", JSON.stringify(next));
            return next;
          });
        };

        return (
        <div>
          {/* ── 銀行・現金資産（円） ── */}
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.line}`, padding: "14px", marginBottom: 16, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>銀行・現金資産</div>
              <button onClick={() => setManualFormOpen(manualFormOpen === "JPY" ? null : "JPY")} style={{ background: "none", border: `1px solid ${C.acc}`, color: C.acc, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                + 現金手入力
              </button>
            </div>
            {manualFormOpen === "JPY" && (
              <ManualCashForm currency="JPY" unitLabel="残高（円）" onSubmit={addManualCash} onCancel={() => setManualFormOpen(null)} />
            )}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 8 }}>
                <thead>
                  <tr>
                    <SortTh label="名称・口座名" sortKey="name" tableId="bank_jpy" getSort={getSort} onSort={onSort} />
                    <SortTh label="JPY残高" sortKey="amount" tableId="bank_jpy" getSort={getSort} onSort={onSort} right />
                    <SortTh label="最終更新日" sortKey="lastUpdate" tableId="bank_jpy" getSort={getSort} onSort={onSort} isDate />
                    <th style={{ padding: "10px 8px", color: C.muted, fontWeight: 600, fontSize: 12, borderBottom: `2px solid ${C.line}` }}>取得元</th>
                    <th style={{ padding: "10px 8px", color: C.muted, fontWeight: 600, fontSize: 12, borderBottom: `2px solid ${C.line}`, textAlign: "center" }}>除外</th>
                  </tr>
                </thead>
                <tbody>
                  {jpyRows.map((it, i) => {
                    const isEx = (bankExclusions || {})[it.name];
                    return (
                    <tr key={i} style={{ borderBottom: `1px solid ${C.line}`, opacity: isEx ? 0.4 : 1 }}>
                      <td style={{ padding: "8px", color: C.text, fontWeight: 500 }}>
                        {it.name}
                        {it.src === "MANUAL" && <ManualHistoryRow name={it.name} currency="JPY" entries={manualCash} unitFmt={fmt} onDelete={deleteManualCash} />}
                      </td>
                      <td style={{ padding: "8px", textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>{fmt(it.amount)}</td>
                      <td style={{ padding: "8px", color: C.muted, fontSize: 11 }}>{fmtDate(it.lastUpdate)}</td>
                      <td style={{ padding: "8px" }}><Tag src={it.src}/></td>
                      <td style={{ padding: "8px", textAlign: "center" }}>
                        <button onClick={() => toggleExclusion(it.name)} style={{ background: isEx ? C.acc : "transparent", border: `1px solid ${C.acc}`, color: isEx ? "#fff" : C.acc, borderRadius: 6, padding: "2px 8px", fontSize: 10, cursor: "pointer", fontWeight: 600 }}>
                          {isEx ? "除外中" : "除外"}
                        </button>
                      </td>
                    </tr>
                    );
                  })}
                  <tr style={{ borderTop: `2px solid ${C.line}`, fontWeight: 700, background: isDark ? "#16253b" : "#f8fafc" }}>
                    <td style={{ padding: "10px 8px" }}>合計</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", fontFamily: "monospace" }}>{fmt(jpyTotal)}</td>
                    <td colSpan={3}></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ── 米ドル資産 ── */}
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "16px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, borderBottom: `1px solid ${C.line}`, paddingBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>💵 米ドル資産</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 12 }}>
                  {usdLoad
                    ? <span style={{ color: C.muted }}>取得中…</span>
                    : usdJpy
                    ? <span style={{ color: C.green, fontWeight: 700 }}>1 USD = ¥{usdJpy.toFixed(2)}</span>
                    : <span style={{ color: C.amber }}>レート取得失敗</span>}
                </div>
                <button onClick={() => setManualFormOpen(manualFormOpen === "USD" ? null : "USD")} style={{ background: "none", border: `1px solid ${C.acc}`, color: C.acc, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  + 現金手入力
                </button>
              </div>
            </div>
            {manualFormOpen === "USD" && (
              <ManualCashForm currency="USD" unitLabel="残高（USD）" onSubmit={addManualCash} onCancel={() => setManualFormOpen(null)} />
            )}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 8 }}>
              <thead>
                <tr>
                  <SortTh label="名称・口座名" sortKey="name" tableId="bank_usd" getSort={getSort} onSort={onSort} />
                  <SortTh label="USD残高" sortKey="usd" tableId="bank_usd" getSort={getSort} onSort={onSort} right />
                  <th style={{ padding: "10px 8px", textAlign: "right", color: C.muted, fontWeight: 600, fontSize: 12, borderBottom: `2px solid ${C.line}` }}>円換算</th>
                  <SortTh label="最終更新日" sortKey="lastUpdate" tableId="bank_usd" getSort={getSort} onSort={onSort} isDate />
                  <th style={{ padding: "10px 8px", color: C.muted, fontWeight: 600, fontSize: 12, borderBottom: `2px solid ${C.line}` }}>取得元</th>
                </tr>
              </thead>
              <tbody>
                {usdRows.map((it, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: "8px", color: C.text, fontWeight: 500 }}>
                      {it.name}
                      {it.src === "MANUAL" && <ManualHistoryRow name={it.name} currency="USD" entries={manualCash} unitFmt={(v) => "$" + Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 })} onDelete={deleteManualCash} />}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", color: C.amber, fontWeight: 700, fontFamily: "monospace" }}>
                      ${Number(it.usd).toLocaleString("en-US", { minimumFractionDigits:2 })}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>
                      {usdJpy ? fmt(Math.round(it.usd * usdJpy)) : "─"}
                    </td>
                    <td style={{ padding: "8px", color: C.muted, fontSize: 11 }}>{fmtDate(it.lastUpdate)}</td>
                    <td style={{ padding: "8px" }}><Tag src={it.src}/></td>
                  </tr>
                ))}
                <tr style={{ borderTop: `2px solid ${C.line}`, fontWeight: 700, background: isDark ? "#16253b" : "#f8fafc" }}>
                  <td style={{ padding: "10px 8px" }}>合計</td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: C.amber, fontFamily: "monospace" }}>
                    ${usdRowsTotal.toLocaleString("en-US", { minimumFractionDigits:2 })}
                  </td>
                  <td style={{ padding: "10px 8px", textAlign: "right", color: C.text, fontFamily: "monospace" }}>
                    {usdJpy ? fmt(Math.round(usdRowsTotal * usdJpy)) : "─"}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── タイバーツ資産 ── */}
          <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "16px", marginTop: 16, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, borderBottom: `1px solid ${C.line}`, paddingBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>🇹🇭 タイバーツ資産</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontSize: 12 }}>
                  {thbJpy
                    ? <span style={{ color: thbIsFallback ? C.amber : C.green, fontWeight: 700 }}>1 THB = ¥{thbJpy.toFixed(3)}{thbIsFallback ? "（仮）" : ""}</span>
                    : <span style={{ color: C.muted }}>レート取得中…</span>}
                </div>
                <button onClick={() => setManualFormOpen(manualFormOpen === "THB" ? null : "THB")} style={{ background: "none", border: `1px solid ${C.acc}`, color: C.acc, borderRadius: 8, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                  + 現金手入力
                </button>
              </div>
            </div>
            {manualFormOpen === "THB" && (
              <ManualCashForm currency="THB" unitLabel="残高（THB）" onSubmit={addManualCash} onCancel={() => setManualFormOpen(null)} />
            )}
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, marginTop: 8 }}>
              <thead>
                <tr>
                  <SortTh label="名称・口座名" sortKey="name" tableId="bank_thb" getSort={getSort} onSort={onSort} />
                  <SortTh label="THB残高" sortKey="thb" tableId="bank_thb" getSort={getSort} onSort={onSort} right />
                  <th style={{ padding: "10px 8px", textAlign: "right", color: C.muted, fontWeight: 600, fontSize: 12, borderBottom: `2px solid ${C.line}` }}>円換算</th>
                  <SortTh label="最終更新日" sortKey="lastUpdate" tableId="bank_thb" getSort={getSort} onSort={onSort} isDate />
                  <th style={{ padding: "10px 8px", color: C.muted, fontWeight: 600, fontSize: 12, borderBottom: `2px solid ${C.line}` }}>取得元</th>
                </tr>
              </thead>
              <tbody>
                {thbRows.map((it, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.line}` }}>
                    <td style={{ padding: "8px", color: C.text, fontWeight: 500 }}>
                      {it.name}
                      <ManualHistoryRow name={it.name} currency="THB" entries={manualCash} unitFmt={(v) => "฿" + Number(v).toLocaleString("en-US")} onDelete={deleteManualCash} />
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", color: C.amber, fontWeight: 700, fontFamily: "monospace" }}>
                      ฿{Number(it.thb).toLocaleString("en-US")}
                    </td>
                    <td style={{ padding: "8px", textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>
                      {thbJpy ? fmt(Math.round(it.thb * thbJpy)) : "─"}
                    </td>
                    <td style={{ padding: "8px", color: C.muted, fontSize: 11 }}>{fmtDate(it.lastUpdate)}</td>
                    <td style={{ padding: "8px" }}><Tag src={it.src}/></td>
                  </tr>
                ))}
                {thbRows.length === 0 && (
                  <tr><td colSpan={5} style={{ padding: "16px 8px", textAlign: "center", color: C.muted, fontSize: 12 }}>「+ 現金手入力」から登録してください</td></tr>
                )}
                {thbRows.length > 0 && (
                  <tr style={{ borderTop: `2px solid ${C.line}`, fontWeight: 700, background: isDark ? "#16253b" : "#f8fafc" }}>
                    <td style={{ padding: "10px 8px" }}>合計</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", color: C.amber, fontFamily: "monospace" }}>฿{thbRowsTotal.toLocaleString("en-US")}</td>
                    <td style={{ padding: "10px 8px", textAlign: "right", color: C.text, fontFamily: "monospace" }}>{thbJpy ? fmt(Math.round(thbRowsTotal * thbJpy)) : "─"}</td>
                    <td colSpan={2}></td>
                  </tr>
                )}
              </tbody>
            </table>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 10 }}>※ SCB（タイ）はAPI/スクレイピング非対応のため手入力管理。総合資産（GRAND_TOTAL）には現状未加算です</div>
          </div>
        </div>
        );
      })()}

      {/* ── TAB: 保険/年金 ── */}
      {tab === "insurance" && (
        <div>
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.line}`, padding: "14px", marginBottom: 16, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <SecHead title="iDeCo（SBI確定拠出年金）" total={IDECO_TOTAL} cost={IDECO_COST} pnl={IDECO_PNL}/>
            {MF_IDECO_LAST_UPDATE && (
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>最終取得日: {fmtDate(MF_IDECO_LAST_UPDATE)}</div>
            )}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr>
                    <SortTh label="銘柄" sortKey="name" tableId="ideco" getSort={getSort} onSort={onSort} />
                    <Th right>平均取得単価</Th>
                    <Th right>保有数量</Th>
                    <Th right>最新単価</Th>
                    <SortTh label="取得価額" sortKey="cost" tableId="ideco" getSort={getSort} onSort={onSort} right />
                    <SortTh label="現在価値" sortKey="amount" tableId="ideco" getSort={getSort} onSort={onSort} right />
                    <SortTh label="含み益" sortKey="pnl" tableId="ideco" getSort={getSort} onSort={onSort} right />
                    <Th right>配当利回り</Th>
                    <Th right>配当月</Th>
                  </tr>
                </thead>
                <tbody>
                  {applySort(IDECO_ITEMS, "ideco").map((it, i) => (
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

          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.line}`, padding: "14px", marginBottom: 16, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
            <SecHead title="ソニー生命（解約返戻金）" total={SONY_TOTAL} cost={SONY_COST} pnl={SONY_PNL}/>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr>
                    <SortTh label="契約" sortKey="name" tableId="sony" getSort={getSort} onSort={onSort} />
                    <SortTh label="証券番号" sortKey="certNo" tableId="sony" getSort={getSort} onSort={onSort} />
                    <SortTh label="解約返戻金" sortKey="amount" tableId="sony" getSort={getSort} onSort={onSort} right />
                    <SortTh label="払込保険料" sortKey="cost" tableId="sony" getSort={getSort} onSort={onSort} right />
                    <Th right>損益</Th>
                  </tr>
                </thead>
                <tbody>
                  {applySort(SONY_ITEMS, "sony").map(it => {
                    const gain = it.amount - it.cost;
                    return (
                      <tr key={it.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                        <td style={{ padding: "8px", color: C.text, fontWeight: 500, whiteSpace: "nowrap" }}>{it.name} <Tag src="SL"/></td>
                        <td style={{ padding: "8px", color: C.muted, fontSize: 11, whiteSpace: "nowrap" }}>{it.certNo}</td>
                        <td style={{ padding: "8px", textAlign: "right", fontFamily: "monospace", fontWeight: 600, whiteSpace: "nowrap" }}>{fmt(it.amount)}</td>
                        <td style={{ padding: "8px", textAlign: "right", color: C.muted, fontFamily: "monospace", whiteSpace: "nowrap" }}>{fmt(it.cost)}</td>
                        <td style={{ padding: "8px", textAlign: "right", color: pnlClr(gain), fontSize: 12, fontWeight: 700, fontFamily: "monospace", whiteSpace: "nowrap" }}>{sgn(gain)}{fmt(gain)}</td>
                      </tr>
                    );
                  })}
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
                      ["契約開始日", fmtDate(c.startDate)],
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
        岡野ファミリー 資産管理 {DASHBOARD_VERSION} ｜ {DATA_DATE}
      </div>
    </div>
  );
}
