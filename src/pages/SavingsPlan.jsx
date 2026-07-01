/**
 * 積立設定管理（A-3）
 * SBI証券・日興証券・iDeCoの月次積立設定を一元管理。
 * データはlocalStorageで手動管理（証券会社サイトのスクレイピング非対応のため）。
 */
import { useState, useEffect } from "react";

// ================================================================
// テーマカラー動的定義（Portal/Dashboardと完全に同期）
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

let C = getColors(false); // 初期値（レンダー前のundefined回避）

const fmt = (n) => "¥" + Math.round(Math.abs(n || 0)).toLocaleString("ja-JP");

const STORAGE_KEY = "okano-savings-plan-v1";

const PERSON_LIST  = ["本人", "妻", "長女", "次女", "長男"];
const ACCOUNT_LIST = ["SBI証券", "日興証券", "iDeCo"];
const PAYMENT_LIST = [
  { value: "cash",   label: "現金" },
  { value: "credit", label: "クレジットカード" },
];
const CUSTODY_LIST = [
  { value: "taxable",        label: "特定" },
  { value: "nisa_tsumitate", label: "NISA（つみたて）" },
  { value: "nisa_growth",    label: "NISA（成長）" },
];

const paymentLabel = (v) => PAYMENT_LIST.find((p) => p.value === v)?.label || "ー";
const custodyLabel = (v) => CUSTODY_LIST.find((c) => c.value === v)?.label || "ー";

// ================================================================
// 初期データ（2026-06-30 各社サイトのスクリーンショットより入力）
// ================================================================
const INIT_DATA = [
  // 本人 SBI証券
  { id: "SP-001", person: "本人", account: "SBI証券", fundName: "eMAXIS Slim 全世界株式（オール・カントリー）", paymentMethod: "cash",   custodyType: "taxable",        monthlyAmount: 220000, archived: false, archivedDate: null, notes: "複数日(5日,15日)に分割発注" },
  { id: "SP-002", person: "本人", account: "SBI証券", fundName: "eMAXIS Slim 全世界株式（オール・カントリー）", paymentMethod: "credit", custodyType: "nisa_tsumitate", monthlyAmount: 100000, archived: false, archivedDate: null, notes: "" },
  { id: "SP-003", person: "本人", account: "SBI証券", fundName: "eMAXIS Slim 米国株式（S&P500）",                 paymentMethod: "cash",   custodyType: "taxable",        monthlyAmount: 70000,  archived: false, archivedDate: null, notes: "複数日(5日,15日)に分割発注" },
  { id: "SP-004", person: "本人", account: "SBI証券", fundName: "ニッセイNASDAQ100インデックスファンド",          paymentMethod: "cash",   custodyType: "taxable",        monthlyAmount: 10000,  archived: false, archivedDate: null, notes: "" },
  // 本人 iDeCo
  { id: "SP-005", person: "本人", account: "iDeCo",   fundName: "eMAXIS Slim 国内株式（TOPIX）",                  paymentMethod: null,     custodyType: null,             monthlyAmount: 1000,   archived: false, archivedDate: null, notes: "配分割合20%" },
  { id: "SP-006", person: "本人", account: "iDeCo",   fundName: "eMAXIS Slim 全世界株式（除く日本）",              paymentMethod: null,     custodyType: null,             monthlyAmount: 4000,   archived: false, archivedDate: null, notes: "配分割合80%" },
  // 妻 SBI証券
  { id: "SP-007", person: "妻",   account: "SBI証券", fundName: "eMAXIS Slim 米国株式（S&P500）",                 paymentMethod: "credit", custodyType: "nisa_growth",    monthlyAmount: 50000,  archived: false, archivedDate: null, notes: "" },
  { id: "SP-008", person: "妻",   account: "SBI証券", fundName: "eMAXIS Slim 全世界株式（オール・カントリー）",  paymentMethod: "credit", custodyType: "nisa_tsumitate", monthlyAmount: 50000,  archived: false, archivedDate: null, notes: "" },
  { id: "SP-009", person: "妻",   account: "SBI証券", fundName: "ニッセイNASDAQ100インデックスファンド",          paymentMethod: "cash",   custodyType: "nisa_growth",    monthlyAmount: 50000,  archived: false, archivedDate: null, notes: "" },
  // 長女 日興証券
  { id: "SP-010", person: "長女", account: "日興証券", fundName: "日本株配当オープン",                              paymentMethod: "cash",   custodyType: "taxable",        monthlyAmount: 70000,  archived: false, archivedDate: null, notes: "" },
  // 長男 日興証券
  { id: "SP-011", person: "長男", account: "日興証券", fundName: "eMAXIS Slim 米国株式（S&P500）",                 paymentMethod: "cash",   custodyType: "taxable",        monthlyAmount: 37000,  archived: false, archivedDate: null, notes: "" },
  { id: "SP-012", person: "長男", account: "日興証券", fundName: "SBI・V・米国高配当株式インデックス",              paymentMethod: "cash",   custodyType: "taxable",        monthlyAmount: 37000,  archived: false, archivedDate: null, notes: "" },
  // 次女 日興証券
  { id: "SP-013", person: "次女", account: "日興証券", fundName: "eMAXIS Slim 米国株式（S&P500）",                 paymentMethod: "cash",   custodyType: "taxable",        monthlyAmount: 70000,  archived: false, archivedDate: null, notes: "" },
];

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INIT_DATA;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INIT_DATA;
  } catch {
    return INIT_DATA;
  }
}
function saveData(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("積立データの保存に失敗しました", e);
  }
}

// ================================================================
// UIパーツ
// ================================================================
function Field({ label, value, onChange, type = "text", options, rows }) {
  const base = {
    width: "100%", background: "#ffffff", border: `1px solid ${C.line}`,
    color: "#0f172a", borderRadius: 8, padding: "8px 12px", fontSize: 13,
    boxSizing: "border-box", marginTop: 4,
  };
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, display: "block" }}>{label}</label>
      {options ? (
        <select value={value} onChange={(e) => onChange(e.target.value)} style={base}>
          {options.map((o) => (
            <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
          ))}
        </select>
      ) : rows ? (
        <textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} style={{ ...base, resize: "vertical" }} />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
          style={base}
        />
      )}
    </div>
  );
}

function SavingsForm({ item, onSubmit, onCancel, submitLabel }) {
  const [f, setF] = useState(item);
  const set = (field) => (val) => {
    const next = { ...f, [field]: val };
    // iDeCoは決済方法・預り区分の概念がないためnull固定
    if (field === "account" && val === "iDeCo") {
      next.paymentMethod = null;
      next.custodyType = null;
    }
    setF(next);
  };
  const isIdeco = f.account === "iDeCo";
  return (
    <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "16px 20px", marginTop: 12, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)" }}>
      <Field label="対象者"   value={f.person}  onChange={set("person")}  options={PERSON_LIST} />
      <Field label="口座"     value={f.account} onChange={set("account")} options={ACCOUNT_LIST} />
      <Field label="ファンド名" value={f.fundName} onChange={set("fundName")} />
      <Field label="月額積立額（円）" value={f.monthlyAmount} onChange={set("monthlyAmount")} type="number" />
      {!isIdeco && (
        <>
          <Field label="決済方法" value={f.paymentMethod || "cash"} onChange={set("paymentMethod")} options={PAYMENT_LIST} />
          <Field label="預り区分" value={f.custodyType || "taxable"} onChange={set("custodyType")} options={CUSTODY_LIST} />
        </>
      )}
      <Field label="備考" value={f.notes} onChange={set("notes")} rows={2} />
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button
          onClick={() => onSubmit(f)}
          style={{ background: C.acc, border: "none", color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
        >
          {submitLabel}
        </button>
        <button
          onClick={onCancel}
          style={{ background: "#f1f5f9", border: "none", color: "#64748b", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}

function ArchiveModal({ item, onConfirm, onCancel }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div style={{ background: C.card, borderRadius: 16, padding: 24, width: 320, boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 4 }}>積立設定をアーカイブ</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 16 }}>{item.person} / {item.fundName}</div>
        <Field label="積立設定解除日" value={date} onChange={setDate} type="date" />
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            onClick={() => onConfirm(date)}
            style={{ background: C.red, border: "none", color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            アーカイブする
          </button>
          <button
            onClick={onCancel}
            style={{ background: "#f1f5f9", border: "none", color: "#64748b", borderRadius: 8, padding: "8px 16px", fontSize: 13, cursor: "pointer" }}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
      <span style={{ color: C.muted }}>{label}</span>
      <span style={{ fontWeight: 700, color: color || C.text, fontFamily: "monospace" }}>{fmt(value)}</span>
    </div>
  );
}

function SortTh({ label, sortKey, currentKey, dir, onSort, right }) {
  const active = currentKey === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      style={{ padding: "8px 6px", textAlign: right ? "right" : "left", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
    >
      {label}
      <span style={{ marginLeft: 4, fontSize: 10, color: active ? C.acc : C.line }}>
        {active ? (dir === "asc" ? "▲" : "▼") : "▲▼"}
      </span>
    </th>
  );
}

// ================================================================
// メインコンポーネント
// ================================================================
export default function SavingsPlan() {
  const [theme, setTheme] = useState("light");
  const [list, setList] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc"); // "asc" | "desc"

  useEffect(() => {
    setTheme(localStorage.getItem("okano-app-theme") || "light");
    setList(loadData());
  }, []);

  const isDark = theme === "dark";
  C = getColors(isDark);

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("okano-app-theme", next);
  };

  const persist = (next) => {
    setList(next);
    saveData(next);
  };

  const handleAdd = (f) => {
    persist([...list, { ...f, id: `SP-${Date.now()}`, archived: false, archivedDate: null }]);
    setAddMode(false);
  };
  const handleEdit = (f) => {
    persist(list.map((i) => (i.id === f.id ? f : i)));
    setEditId(null);
  };
  const handleArchiveConfirm = (date) => {
    persist(list.map((i) => (i.id === archiveTarget.id ? { ...i, archived: true, archivedDate: date } : i)));
    setArchiveTarget(null);
  };
  const handleRestore = (id) => {
    persist(list.map((i) => (i.id === id ? { ...i, archived: false, archivedDate: null } : i)));
  };

  const active = list.filter((i) => !i.archived);
  const archived = list.filter((i) => i.archived);
  const view = showArchived ? archived : active;

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };
  const sortedView = [...view].sort((a, b) => {
    if (!sortKey) return 0;
    const av = a[sortKey];
    const bv = b[sortKey];
    let cmp;
    if (sortKey === "monthlyAmount") {
      cmp = Number(av || 0) - Number(bv || 0);
    } else {
      cmp = String(av ?? "").localeCompare(String(bv ?? ""), "ja");
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  // ── 集計 ──
  const totalMonthly = active.reduce((s, i) => s + Number(i.monthlyAmount || 0), 0);
  const idecoMonthly = active.filter((i) => i.account === "iDeCo").reduce((s, i) => s + Number(i.monthlyAmount || 0), 0);
  const investMonthly = totalMonthly - idecoMonthly; // 決済方法・預り区分集計の母数（iDeCo除く）

  const byPayment = PAYMENT_LIST.map((p) => ({
    label: p.label,
    monthly: active.filter((i) => i.account !== "iDeCo" && i.paymentMethod === p.value).reduce((s, i) => s + Number(i.monthlyAmount || 0), 0),
  }));
  const byCustody = CUSTODY_LIST.map((c) => ({
    label: c.label,
    monthly: active.filter((i) => i.account !== "iDeCo" && i.custodyType === c.value).reduce((s, i) => s + Number(i.monthlyAmount || 0), 0),
  }));
  const byPerson = PERSON_LIST.map((p) => ({
    label: p,
    monthly: active.filter((i) => i.person === p).reduce((s, i) => s + Number(i.monthlyAmount || 0), 0),
  })).filter((p) => p.monthly > 0);

  const editingItem = editId ? list.find((i) => i.id === editId) : null;

  return (
    <div style={{
      background: C.bg, minHeight: "100vh", color: C.text,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      paddingBottom: 60,
    }}>
      {/* ── ヘッダー ── */}
      <div style={{ background: C.card, padding: "16px 20px", borderBottom: `1px solid ${C.line}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => { window.location.href = "/"; }}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "6px 12px", borderRadius: 8,
              border: `1px solid ${C.line}`, background: C.bg,
              fontSize: 12, color: C.muted, cursor: "pointer",
              fontWeight: 600, transition: "all 0.2s"
            }}
          >
            ← ポータルへ
          </button>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>💰 積立設定管理</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>SBI証券・日興証券・iDeCo　月次積立の一元管理</div>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          style={{ background: isDark ? "#1e2d45" : "#f1f5f9", border: "none", borderRadius: 20, color: C.muted, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
        >
          {isDark ? "☀️ LIGHT" : "🌙 DARK"}
        </button>
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        {/* ── サマリーカード（1枚に統合） ── */}
        <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 16, padding: "16px 18px", marginBottom: 8, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 6 }}>
            <div style={{ fontSize: 12, color: C.muted, fontWeight: 600 }}>積立合計（全員）</div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: C.acc, fontFamily: "monospace" }}>{fmt(totalMonthly)}</span>
              <span style={{ fontSize: 11, color: C.muted }}> /月　{fmt(totalMonthly * 12)} /年</span>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 16px", fontSize: 12, borderTop: `1px solid ${C.line}`, marginTop: 10, paddingTop: 10 }}>
            <SummaryRow label="iDeCo" value={idecoMonthly} color={C.purple} />
            {byPayment.map((b) => <SummaryRow key={b.label} label={b.label} value={b.monthly} />)}
            {byCustody.map((b) => <SummaryRow key={b.label} label={b.label} value={b.monthly} />)}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px", fontSize: 11, borderTop: `1px solid ${C.line}`, marginTop: 10, paddingTop: 10 }}>
            {byPerson.map((b) => (
              <div key={b.label} style={{ color: C.muted }}>
                <span style={{ fontWeight: 700, color: C.text }}>{b.label}</span> {fmt(b.monthly)}
              </div>
            ))}
          </div>
        </div>

        {/* ── 一覧 ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "28px 0 12px" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setShowArchived(false)}
              style={{ background: !showArchived ? C.acc : "transparent", color: !showArchived ? "#fff" : C.muted, border: `1px solid ${!showArchived ? C.acc : C.line}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              運用中（{active.length}）
            </button>
            <button
              onClick={() => setShowArchived(true)}
              style={{ background: showArchived ? C.acc : "transparent", color: showArchived ? "#fff" : C.muted, border: `1px solid ${showArchived ? C.acc : C.line}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
            >
              アーカイブ済み（{archived.length}）
            </button>
          </div>
          {!showArchived && (
            <button
              onClick={() => setAddMode(true)}
              style={{ background: C.green, border: "none", color: "#fff", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              ＋ 積立設定を追加
            </button>
          )}
        </div>

        {addMode && (
          <SavingsForm
            item={{ person: "本人", account: "SBI証券", fundName: "", paymentMethod: "cash", custodyType: "taxable", monthlyAmount: 0, notes: "" }}
            onSubmit={handleAdd}
            onCancel={() => setAddMode(false)}
            submitLabel="追加"
          />
        )}

        {editingItem && (
          <SavingsForm item={editingItem} onSubmit={handleEdit} onCancel={() => setEditId(null)} submitLabel="保存" />
        )}

        {/* ── テーブル ── */}
        <div style={{ marginTop: 16, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.line}`, color: C.muted, textAlign: "left" }}>
                <SortTh label="対象者"     sortKey="person"        currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="口座"       sortKey="account"       currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="ファンド名" sortKey="fundName"      currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="決済方法"   sortKey="paymentMethod" currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="預り区分"   sortKey="custodyType"   currentKey={sortKey} dir={sortDir} onSort={handleSort} />
                <SortTh label="月額"       sortKey="monthlyAmount" currentKey={sortKey} dir={sortDir} onSort={handleSort} right />
                {showArchived && <SortTh label="解除日" sortKey="archivedDate" currentKey={sortKey} dir={sortDir} onSort={handleSort} />}
                <th style={{ padding: "8px 6px" }}></th>
              </tr>
            </thead>
            <tbody>
              {sortedView.map((i) => (
                <tr key={i.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "8px 6px", fontWeight: 600 }}>{i.person}</td>
                  <td style={{ padding: "8px 6px", color: C.muted }}>{i.account}</td>
                  <td style={{ padding: "8px 6px" }}>{i.fundName}</td>
                  <td style={{ padding: "8px 6px", color: C.muted }}>{i.account === "iDeCo" ? "ー" : paymentLabel(i.paymentMethod)}</td>
                  <td style={{ padding: "8px 6px", color: C.muted }}>{i.account === "iDeCo" ? "ー" : custodyLabel(i.custodyType)}</td>
                  <td style={{ padding: "8px 6px", textAlign: "right", fontWeight: 700 }}>{fmt(i.monthlyAmount)}</td>
                  {showArchived && <td style={{ padding: "8px 6px", color: C.amber }}>{i.archivedDate || "ー"}</td>}
                  <td style={{ padding: "8px 6px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {!showArchived ? (
                      <>
                        <button onClick={() => setEditId(i.id)} style={{ background: "none", border: "none", color: C.acc, fontSize: 12, cursor: "pointer", marginRight: 8 }}>編集</button>
                        <button onClick={() => setArchiveTarget(i)} style={{ background: "none", border: "none", color: C.muted, fontSize: 12, cursor: "pointer" }}>アーカイブ</button>
                      </>
                    ) : (
                      <button onClick={() => handleRestore(i.id)} style={{ background: "none", border: "none", color: C.green, fontSize: 12, cursor: "pointer" }}>復元</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {sortedView.length === 0 && (
            <div style={{ textAlign: "center", color: C.muted, padding: 40, fontSize: 13 }}>
              {showArchived ? "アーカイブ済みの積立設定はありません" : "積立設定がありません"}
            </div>
          )}
        </div>
      </div>

      {archiveTarget && (
        <ArchiveModal item={archiveTarget} onConfirm={handleArchiveConfirm} onCancel={() => setArchiveTarget(null)} />
      )}
    </div>
  );
}
