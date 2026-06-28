/**
 * 資産管理ダッシュボード
 * Claude artifacts の window.storage → localStorage に変換済み
 * GitHub Pages / Vite + React Router で動作
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, ReferenceLine,
} from "recharts";

// ─── 定数 ───────────────────────────────────────
const STORAGE_KEY = "okano-assets-v3";
const GOAL        = 200_000_000;
const GOAL_YEAR   = 2037;

// ─── ユーティリティ ──────────────────────────────
const fmt  = (n) => (n < 0 ? "-" : "") + "¥" + Math.abs(Math.round(n)).toLocaleString("ja-JP");
const fmtM = (n) => `¥${(n / 10_000).toFixed(0)}万`;
const pclr = (n) => (n >= 0 ? "#22c55e" : "#ef4444");
const sign = (n)  => (n > 0 ? "+" : "") + fmtM(n);

// ─── 初期データ（2026/06/27 実績）──────────────
const SEED = {
  date: "2026-06-27", label: "2026/06",
  mt: 27_656_207, mf_unique: 4_396_145, sony: 4_713_605,
  grand: 36_769_624,
  cash: 7_579_566, securities_rf: 13_356_700,
  ideco: 129_866, insurance: 4_713_605,
  liabilities: -126_313, rf_pnl: 1_647_809,
  notes: "初回データ（Robofolio+MT+MF+SonyLife）",
};

// ─── カラー ──────────────────────────────────────
const C = {
  bg: "#0a0f1a", card: "#121c2e", line: "#1e2d45",
  text: "#e2e8f0", muted: "#4a6080",
  acc: "#3b82f6", green: "#22c55e", amber: "#f59e0b",
  purple: "#8b5cf6",
  pie: ["#22c55e", "#3b82f6", "#8b5cf6", "#14b8a6", "#fb923c", "#64748b"],
};

// ─── localStorage ヘルパー ────────────────────────
function loadSnaps() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [SEED];
}

function saveSnaps(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

// ─── 小コンポーネント ────────────────────────────
const Card = ({ children, style = {} }) => (
  <div style={{ background: C.card, borderRadius: 12, padding: 14, ...style }}>
    {children}
  </div>
);

const SectionLabel = ({ children }) => (
  <div style={{
    color: C.muted, fontSize: 11, marginBottom: 8,
    textTransform: "uppercase", letterSpacing: ".06em",
  }}>
    {children}
  </div>
);

const TabBar = ({ tabs, active, onChange }) => (
  <div style={{ display: "flex", background: C.card, borderBottom: `1px solid ${C.line}` }}>
    {tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} style={{
        flex: 1, padding: "10px 4px", background: "none", border: "none",
        borderBottom: active === t.id ? `2px solid ${C.acc}` : "2px solid transparent",
        color: active === t.id ? C.acc : C.muted,
        fontSize: 11, cursor: "pointer", fontWeight: active === t.id ? 700 : 400,
      }}>
        {t.icon} {t.label}
      </button>
    ))}
  </div>
);

const TTStyle = { background: "#1e2d45", border: "1px solid #1e2d45", fontSize: 11 };

// ─── メインコンポーネント ─────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();

  // localStorage から同期ロード（非同期不要）
  const [snaps,   setSnaps]   = useState(() => loadSnaps());
  const [tab,     setTab]     = useState("now");
  const [msg,     setMsg]     = useState("");
  const [saving,  setSaving]  = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    date: today, mt: "", mf_unique: "", sony: "",
    cash: "", securities_rf: "", rf_pnl: "", notes: "",
  });

  // ─ 保存 ────────────────────────────────────────
  const persist = useCallback((next) => {
    setSaving(true);
    const ok = saveSnaps(next);
    setSnaps(next);
    setMsg(ok ? "✅ 保存しました" : "❌ 保存失敗（ストレージ容量を確認してください）");
    setTimeout(() => setMsg(""), 2500);
    setSaving(false);
  }, []);

  // ─ スナップショット追加 ─────────────────────────
  const addSnap = useCallback(() => {
    const n = (k) => Number(String(form[k] || "0").replace(/,/g, "")) || 0;
    const mt = n("mt"), mf = n("mf_unique"), so = n("sony");
    const grand = mt + mf + so;
    if (!grand) { setMsg("⚠️ MoneyTree合計を入力してください"); return; }

    const snap = {
      date:  form.date,
      label: form.date.slice(0, 7).replace("-", "/"),
      mt, mf_unique: mf, sony: so, grand,
      cash:          n("cash")          || undefined,
      securities_rf: n("securities_rf") || undefined,
      rf_pnl:        n("rf_pnl")        || undefined,
      insurance: so, liabilities: 0, ideco: 0,
      notes: form.notes || "手動入力",
    };

    const sorted = [...snaps, snap].sort((a, b) => a.date.localeCompare(b.date));
    persist(sorted);
    setForm(f => ({ ...f, mt: "", mf_unique: "", sony: "", cash: "", securities_rf: "", rf_pnl: "", notes: "" }));
  }, [form, snaps, persist]);

  // ─ 削除 ────────────────────────────────────────
  const deleteSnap = useCallback((date) => {
    if (snaps.length <= 1) { setMsg("⚠️ 最低1件必要です"); return; }
    persist(snaps.filter(s => s.date !== date));
  }, [snaps, persist]);

  // ─ 派生値 ───────────────────────────────────────
  const latest   = snaps[snaps.length - 1];
  const prev     = snaps.length >= 2 ? snaps[snaps.length - 2] : null;
  const momChg   = prev ? latest.grand - prev.grand : null;
  const progress = (latest.grand / GOAL) * 100;

  const trend = snaps.map(s => ({
    label: s.label,
    total: +(s.grand / 1e4).toFixed(0),
    cash:  s.cash          ? +(s.cash          / 1e4).toFixed(0) : undefined,
    ins:   s.insurance     ? +(s.insurance     / 1e4).toFixed(0) : undefined,
    pct:   +(s.grand / GOAL * 100).toFixed(2),
  }));

  const pie = [
    { name: "現金・預金",   value: latest.cash          || 0 },
    { name: "証券（RF）",  value: latest.securities_rf || 0 },
    { name: "保険",         value: latest.insurance      || 0 },
    { name: "iDeCo",        value: latest.ideco          || 0 },
    {
      name: "その他",
      value: Math.max(0,
        latest.grand
        - (latest.cash          || 0)
        - (latest.securities_rf || 0)
        - (latest.insurance     || 0)
        - (latest.ideco         || 0)
      ),
    },
  ].filter(d => d.value > 500);

  const TABS = [
    { id: "now",     icon: "📊", label: "現状"  },
    { id: "trend",   icon: "📈", label: "推移"  },
    { id: "entry",   icon: "➕", label: "記録"  },
    { id: "history", icon: "🗂️", label: "履歴"  },
  ];

  // ─ レンダー ─────────────────────────────────────
  return (
    <div style={{
      background: C.bg, minHeight: "100vh", color: C.text,
      fontFamily: "-apple-system, 'Helvetica Neue', sans-serif",
      maxWidth: 560, margin: "0 auto", paddingBottom: 40,
    }}>

      {/* ── ヘッダー ── */}
      <div style={{ background: C.card, padding: "12px 16px 10px", borderBottom: `1px solid ${C.line}` }}>

        {/* ← 戻るボタン */}
        <button onClick={() => navigate("/")} style={{
          background: "none", border: "none", color: C.muted,
          fontSize: 12, cursor: "pointer", padding: "0 0 8px", display: "flex", alignItems: "center", gap: 4,
        }}>
          ← ポータルに戻る
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 12, color: C.muted }}>💼 岡野家 資産管理</div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-.02em", marginTop: 2 }}>
              {fmtM(latest.grand)}
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              {latest.date} | {snaps.length}件記録
              {momChg !== null && (
                <span style={{ color: pclr(momChg), marginLeft: 8, fontWeight: 600 }}>
                  前回比 {sign(momChg)}
                </span>
              )}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: C.muted }}>目標 ¥2億</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.amber }}>{progress.toFixed(1)}%</div>
            <div style={{ fontSize: 10, color: C.muted }}>残{GOAL_YEAR - 2026}年</div>
          </div>
        </div>

        {/* 進捗バー */}
        <div style={{ marginTop: 10, background: C.line, borderRadius: 999, height: 8, overflow: "hidden" }}>
          <div style={{
            background: `linear-gradient(90deg, ${C.acc}, ${C.purple})`,
            width: `${Math.min(progress, 100)}%`, height: "100%", transition: "width .6s",
          }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: C.muted, marginTop: 3 }}>
          <span>¥0</span><span>¥2億（{GOAL_YEAR}年）</span>
        </div>
      </div>

      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      {msg && (
        <div style={{ background: "#1e3a5f", color: C.text, fontSize: 12, padding: "8px 16px", textAlign: "center" }}>
          {msg}
        </div>
      )}

      {/* ── 現状タブ ── */}
      {tab === "now" && (
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          <Card>
            <SectionLabel>データソース別 内訳</SectionLabel>
            {[
              { src: "MoneyTree",    val: latest.mt,        note: "銀行/証券/iDeCo（USD換算込）", clr: C.acc    },
              { src: "MoneyForward", val: latest.mf_unique, note: "住信SBI専用（MT未収録）",      clr: C.purple },
              { src: "SonyLife",     val: latest.sony,      note: "解約返戻金2契約",              clr: C.amber  },
            ].map(s => (
              <div key={s.src} style={{ display: "flex", alignItems: "center", padding: "9px 0", borderBottom: `1px solid ${C.line}` }}>
                <div style={{ width: 4, height: 32, background: s.clr, borderRadius: 2, marginRight: 12, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.src}</div>
                  <div style={{ fontSize: 10, color: C.muted }}>{s.note}</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{fmtM(s.val)}</div>
              </div>
            ))}
            <div style={{ padding: "7px 0", fontSize: 11, color: C.muted }}>
              ⚠️ 未取得: FX / 暗号資産 / SCBタイ口座
            </div>
          </Card>

          {(latest.cash || latest.securities_rf) && (
            <Card>
              <SectionLabel>カテゴリ内訳</SectionLabel>
              {[
                { name: "現金・預金",   val: latest.cash,          clr: C.green  },
                { name: "証券（RF）",  val: latest.securities_rf, clr: C.acc    },
                { name: "保険",         val: latest.insurance,     clr: C.amber  },
                { name: "iDeCo",        val: latest.ideco,         clr: C.muted  },
              ].filter(d => d.val > 0).map(d => (
                <div key={d.name} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.line}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: d.clr, display: "inline-block" }} />
                    <span style={{ fontSize: 13 }}>{d.name}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{fmtM(d.val)}</span>
                </div>
              ))}
              {latest.rf_pnl ? (
                <div style={{ paddingTop: 8, fontSize: 12, color: C.green }}>
                  証券含み益合計: +{fmt(latest.rf_pnl)}
                </div>
              ) : null}
            </Card>
          )}

          {pie.length > 0 && (
            <Card>
              <SectionLabel>資産配分</SectionLabel>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pie} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {pie.map((_, i) => <Cell key={i} fill={C.pie[i % C.pie.length]} />)}
                  </Pie>
                  <Tooltip formatter={v => fmt(v)} contentStyle={TTStyle} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      )}

      {/* ── 推移タブ ── */}
      {tab === "trend" && (
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          {snaps.length < 2 ? (
            <Card style={{ textAlign: "center", padding: 40 }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📈</div>
              <div style={{ color: C.muted, fontSize: 13 }}>2件以上で推移グラフが表示されます</div>
              <div style={{ color: C.muted, fontSize: 11, marginTop: 8 }}>「➕ 記録」タブからデータを追加してください</div>
            </Card>
          ) : (
            <>
              <Card>
                <SectionLabel>総資産推移（万円）</SectionLabel>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                    <XAxis dataKey="label" tick={{ fill: C.muted, fontSize: 10 }} />
                    <YAxis tick={{ fill: C.muted, fontSize: 10 }} tickFormatter={v => `${v}万`} />
                    <Tooltip
                      formatter={(v, n) => [`${v}万円`, { total: "総資産", cash: "現金", ins: "保険" }[n] || n]}
                      contentStyle={TTStyle}
                    />
                    <ReferenceLine y={GOAL / 1e4} stroke={C.amber} strokeDasharray="4 4"
                      label={{ value: "目標¥2億", fill: C.amber, fontSize: 10, position: "insideTopRight" }}
                    />
                    <Line type="monotone" dataKey="total" stroke={C.acc} strokeWidth={2.5} dot={{ fill: C.acc, r: 4 }} name="total" />
                    <Line type="monotone" dataKey="cash"  stroke={C.green} strokeWidth={1.5} dot={false} name="cash" />
                    <Line type="monotone" dataKey="ins"   stroke={C.amber} strokeWidth={1}   dot={false} name="ins" />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card>
                <SectionLabel>目標達成率 推移（%）</SectionLabel>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.line} />
                    <XAxis dataKey="label" tick={{ fill: C.muted, fontSize: 10 }} />
                    <YAxis tick={{ fill: C.muted, fontSize: 10 }} tickFormatter={v => `${v}%`} />
                    <Tooltip formatter={v => [`${v}%`, "達成率"]} contentStyle={TTStyle} />
                    <Line type="monotone" dataKey="pct" stroke={C.amber} strokeWidth={2} dot={{ fill: C.amber, r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card>
                <SectionLabel>月次変化一覧</SectionLabel>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ color: C.muted, borderBottom: `1px solid ${C.line}` }}>
                      {["月", "総資産", "前月比", "達成率"].map(h => (
                        <th key={h} style={{ textAlign: h === "月" ? "left" : "right", padding: "4px 6px", fontWeight: 400 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...snaps].reverse().map((s, i, arr) => {
                      const p = arr[i + 1];
                      const d = p ? s.grand - p.grand : null;
                      return (
                        <tr key={s.date} style={{ borderBottom: `1px solid ${C.line}` }}>
                          <td style={{ padding: "6px", color: C.muted }}>{s.label}</td>
                          <td style={{ padding: "6px", textAlign: "right", fontWeight: 600 }}>{fmtM(s.grand)}</td>
                          <td style={{ padding: "6px", textAlign: "right", color: d != null ? pclr(d) : C.muted }}>
                            {d != null ? sign(d) : "–"}
                          </td>
                          <td style={{ padding: "6px", textAlign: "right", color: C.amber }}>
                            {(s.grand / GOAL * 100).toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </>
          )}
        </div>
      )}

      {/* ── 記録タブ ── */}
      {tab === "entry" && (
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          <Card>
            <SectionLabel>月次スナップショット追加</SectionLabel>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>
              スクリプト実行後、各サービスの合計値を入力してください
            </div>
            {[
              { key: "date",         label: "📅 日付",                       type: "date"       },
              { key: "mt",           label: "MoneyTree 合計 ¥",             ph: "27656207"     },
              { key: "mf_unique",    label: "住信SBI（MoneyForward）¥",     ph: "4396145"      },
              { key: "sony",         label: "SonyLife 解約返戻金合計 ¥",    ph: "4713605"      },
              { key: "cash",         label: "現金・預金合計 ¥（任意）",     ph: "7579566"      },
              { key: "securities_rf",label: "Robofolio 証券合計 ¥（任意）", ph: "13356700"     },
              { key: "rf_pnl",       label: "含み益合計 ¥（任意）",         ph: "1647809"      },
              { key: "notes",        label: "メモ（任意）",                  ph: "積み立て継続" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 10 }}>
                <div style={{ color: C.text, fontSize: 12, marginBottom: 4 }}>{f.label}</div>
                <input
                  type={f.type || "text"}
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.ph}
                  style={{
                    width: "100%", background: C.bg, border: `1px solid ${C.line}`,
                    borderRadius: 8, padding: "8px 10px", color: C.text,
                    fontSize: 13, boxSizing: "border-box",
                  }}
                />
              </div>
            ))}

            {/* プレビュー */}
            {(form.mt || form.mf_unique || form.sony) && (() => {
              const t = ["mt", "mf_unique", "sony"].reduce(
                (s, k) => s + (Number(String(form[k] || "0").replace(/,/g, "")) || 0), 0
              );
              return (
                <div style={{ background: C.bg, borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
                  <div style={{ color: C.muted, fontSize: 11 }}>合計プレビュー</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: C.acc, marginTop: 2 }}>{fmtM(t)}</div>
                </div>
              );
            })()}

            <button
              onClick={addSnap}
              disabled={saving || !form.mt}
              style={{
                width: "100%", padding: 12,
                background: form.mt ? C.acc : "#1e2d45",
                color: "#fff", border: "none", borderRadius: 10,
                fontSize: 14, fontWeight: 700,
                cursor: form.mt ? "pointer" : "not-allowed",
              }}
            >
              {saving ? "保存中..." : "📌 スナップショットを保存"}
            </button>
          </Card>
        </div>
      )}

      {/* ── 履歴タブ ── */}
      {tab === "history" && (
        <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          <Card>
            <SectionLabel>保存済みスナップショット（{snaps.length}件）</SectionLabel>
            {[...snaps].reverse().map(s => (
              <div key={s.date} style={{ padding: "10px 0", borderBottom: `1px solid ${C.line}`, display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{s.label}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: C.acc }}>{fmtM(s.grand)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                    MT:{fmtM(s.mt)} / MF:{fmtM(s.mf_unique)} / SL:{fmtM(s.sony)}
                    {s.rf_pnl ? <span style={{ color: C.green }}> | +{fmtM(s.rf_pnl)}</span> : ""}
                  </div>
                  {s.notes && <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{s.notes}</div>}
                </div>
                {snaps.length > 1 && (
                  <button
                    onClick={() => deleteSnap(s.date)}
                    style={{
                      background: "none", border: `1px solid ${C.line}`, color: C.muted,
                      borderRadius: 6, padding: "2px 8px", fontSize: 11,
                      cursor: "pointer", alignSelf: "center", flexShrink: 0,
                    }}
                  >
                    削除
                  </button>
                )}
              </div>
            ))}
          </Card>
          <Card>
            <SectionLabel>ローカルストレージについて</SectionLabel>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.8 }}>
              データはこのブラウザの <span style={{ color: C.text }}>localStorage</span> に保存されています。<br />
              ブラウザを変えると引き継がれません。<br />
              バックアップは「エクスポート」機能で対応予定です。<br />
              <br />
              <span style={{ color: C.text }}>run_all.bat</span> 実行時に<br />
              <span style={{ color: C.text }}>資産管理DB / history.csv</span> にも自動追記されます。
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
