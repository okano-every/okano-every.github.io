import { useState } from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from "recharts";

// ============================================================
// データ定義（2026/06/27 時点）
// ============================================================
const DATA_DATE = "2026/06/27";
const GOAL      = 200_000_000;
const GOAL_YEAR = 2037;

const fmt  = (n) => "¥" + Math.abs(Math.round(n)).toLocaleString("ja-JP");
const fmtM = (n) => `¥${(n / 10_000).toFixed(0)}万`;
const pnlColor = (n) => (n >= 0 ? "#22c55e" : "#ef4444");

const MT_TOTAL   = 27_656_207;
const MF_UNIQUE  =  4_396_145;
const SONY_TOTAL =  4_713_605;
const IDECO_ADJ  =      3_667;
const GRAND_TOTAL = MT_TOTAL + MF_UNIQUE + SONY_TOTAL + IDECO_ADJ;

const RF_ITEMS = [
  { name:"eMAXIS Slim オルカン",    sub:"NISA成長", amount:3_696_245, pnl: 864_206, owner:"本人", acc:"SBI" },
  { name:"iS米国債七十(1655)",       sub:"NISA",    amount:2_044_590, pnl:  44_310, owner:"本人", acc:"SBI" },
  { name:"iS米国債37ヘジ(2856)",     sub:"特定",    amount:2_009_950, pnl: -27_450, owner:"本人", acc:"SBI" },
  { name:"SBI高配当株式",            sub:"NISA",    amount:1_571_655, pnl: 361_979, owner:"本人", acc:"SBI" },
  { name:"eMAXIS Slim オルカン",    sub:"特定",     amount:  692_052, pnl:  32_051, owner:"本人", acc:"SBI" },
  { name:"eMAXIS Slim S&P500",      sub:"特定",     amount:  218_235, pnl:   8_235, owner:"本人", acc:"SBI" },
  { name:"eMAXIS Slim S&P500",      sub:"NISA",     amount:  112_147, pnl:  12_147, owner:"本人", acc:"SBI" },
  { name:"ニッセイNASDAQ100",        sub:"特定",     amount:   32_971, pnl:   2_971, owner:"本人", acc:"SBI" },
  { name:"eMAXIS Neo 宇宙開発",     sub:"特定",     amount:    2_742, pnl:     242, owner:"本人", acc:"SBI" },
  { name:"eMAXIS Slim オルカン",    sub:"NISA",     amount:  236_335, pnl:  16_330, owner:"妻",   acc:"SBI" },
  { name:"eMAXIS Slim S&P500",      sub:"NISA",     amount:  169_446, pnl:   9_446, owner:"妻",   acc:"SBI" },
  { name:"ニッセイNASDAQ100",        sub:"NISA",     amount:  164_836, pnl:  14_832, owner:"妻",   acc:"SBI" },
  { name:"SBI高配当株式 年4回",      sub:"NISA",     amount:  161_526, pnl:  29_159, owner:"妻",   acc:"SBI" },
  { name:"日本株配当オープン",        sub:"NISA",     amount:      734, pnl:      68, owner:"妻",   acc:"SBI" },
  { name:"日本株配当オープン",        sub:"特定",     amount:  550_355, pnl:  46_401, owner:"長女", acc:"日興" },
  { name:"楽天全米株式",             sub:"特定",     amount:  237_929, pnl:  57_929, owner:"長女", acc:"日興" },
  { name:"eMAXIS Slim S&P500",      sub:"特定",     amount:  770_837, pnl: 100_837, owner:"次女", acc:"日興" },
  { name:"eMAXIS Slim S&P500",      sub:"特定",     amount:  281_572, pnl:  22_572, owner:"長男", acc:"日興" },
  { name:"eMAXIS Slim オルカン",    sub:"特定",     amount:  124_059, pnl:  32_060, owner:"長男", acc:"日興" },
  { name:"SBI高配当株式",            sub:"特定",     amount:  278_484, pnl:  19_484, owner:"長男", acc:"日興" },
];
const RF_TOTAL = RF_ITEMS.reduce((s, i) => s + i.amount, 0);
const RF_PNL   = RF_ITEMS.reduce((s, i) => s + i.pnl,    0);

const BANK_ITEMS = [
  { name:"SMBC 本人",              amount:2_264_792, source:"MT", owner:"本人" },
  { name:"SMBC 妻",                amount:  887_749, source:"MT", owner:"妻"   },
  { name:"SMBC 長女",              amount:   10_074, source:"MT", owner:"長女" },
  { name:"SMBC 次女",              amount:   10_074, source:"MT", owner:"次女" },
  { name:"SMBC 長男",              amount:   10_166, source:"MT", owner:"長男" },
  { name:"UFJ 本人",               amount:      566, source:"MT", owner:"本人" },
  { name:"住信SBI 代表",           amount:      114, source:"MF", owner:"本人" },
  { name:"住信SBI ハイブリッド",   amount:4_396_031, source:"MF", owner:"本人" },
];
const BANK_TOTAL = BANK_ITEMS.reduce((s, i) => s + i.amount, 0);
const MT_ONLY_JPY = 3_000_000;

const IDECO_ITEMS = [
  { name:"eMAXIS Slim 全世界(除く日本)", amount:112_673, pnl:19_428 },
  { name:"eMAXIS Slim S&P500",          amount:  1_639, pnl:   371 },
  { name:"eMAXIS Slim 国内株式(TOPIX)",  amount: 14_676, pnl: 3_381 },
  { name:"eMAXIS Slim 新興国株式",       amount:    878, pnl:   317 },
];
const IDECO_TOTAL = IDECO_ITEMS.reduce((s, i) => s + i.amount, 0);

const SONY_ITEMS = [
  { name:"契約1 解約返戻金", amount:3_280_616, cost:2_206_200 },
  { name:"契約2 解約返戻金", amount:1_432_989, cost:1_155_932 },
];

const MISSING = [
  { name:"FX口座（XM Trading / EXNESS）", status:"スクリプト作成中" },
  { name:"暗号資産",                       status:"スクリプト作成中" },
  { name:"SCBタイバーツ口座",               status:"スクリプト作成中" },
  { name:"退職金",                         status:"将来（現職継続中）" },
  { name:"住宅（不動産）",                  status:"将来（購入予定）" },
];

// ============================================================
// UIパーツ
// ============================================================
const C = {
  bg:"#0a0f1a", card:"#121c2e", line:"#1e2d45",
  text:"#e2e8f0", muted:"#4a6080",
  acc:"#3b82f6", green:"#22c55e", amber:"#f59e0b",
};

const SOURCE_COLORS = { MT:"#60a5fa", MF:"#a78bfa", SL:"#fb923c" };
const SOURCE_LABELS = { MT:"MoneyTree", MF:"MoneyForward", SL:"SonyLife" };

const Tag = ({ src }) => (
  <span style={{
    background: SOURCE_COLORS[src] || "#94a3b8",
    color:"#fff", fontSize:10, padding:"1px 6px",
    borderRadius:4, marginLeft:4, whiteSpace:"nowrap",
  }}>{SOURCE_LABELS[src] || src}</span>
);

const SectionHeader = ({ title, total, pnl }) => (
  <div style={{
    display:"flex", alignItems:"center", gap:12,
    margin:"18px 0 8px", borderLeft:"3px solid #3b82f6", paddingLeft:10,
  }}>
    <span style={{ color:"#e2e8f0", fontWeight:700, fontSize:14 }}>{title}</span>
    <span style={{ color:"#f1f5f9", fontSize:13 }}>{fmt(total)}</span>
    {pnl !== undefined && (
      <span style={{ color: pnlColor(pnl), fontSize:12 }}>
        ({pnl >= 0 ? "+" : ""}{fmt(pnl)})
      </span>
    )}
  </div>
);

// ============================================================
// メインコンポーネント
// ============================================================
const TABS = ["summary","securities","banks","insurance","missing"];
const TAB_LABELS = {
  summary:    "📊 サマリ",
  securities: "📈 証券銘柄",
  banks:      "🏦 銀行口座",
  insurance:  "🛡 保険/iDeCo",
  missing:    "⚠️ 未取得",
};

export default function Dashboard() {
  const [tab, setTab] = useState("summary");

  const progress   = (GRAND_TOTAL / GOAL) * 100;
  const yearsLeft  = GOAL_YEAR - 2026;
  const annualNeed = (GOAL - GRAND_TOTAL) / yearsLeft;

  const pieData = [
    { name:"現金・預金",    value: BANK_TOTAL,   color:"#4ade80" },
    { name:"証券（RF）",    value: RF_TOTAL,     color:"#60a5fa" },
    { name:"円債（MT固有）",value: MT_ONLY_JPY,  color:"#818cf8" },
    { name:"iDeCo",        value: IDECO_TOTAL,  color:"#94a3b8" },
    { name:"保険",          value: SONY_TOTAL,   color:"#fb923c" },
  ];

  return (
    <div style={{
      background: C.bg, minHeight:"100vh", color: C.text,
      fontFamily:"-apple-system, 'Helvetica Neue', sans-serif", padding:16,
    }}>

      {/* ── ヘッダー ── */}
      <div style={{
        background: C.card, borderRadius:12,
        padding:"14px 16px", marginBottom:14,
        border:`1px solid ${C.line}`,
      }}>
        <button
          onClick={() => window.history.back()}
          style={{
            background:"none", border:"none", color: C.acc,
            fontSize:13, cursor:"pointer", marginBottom:8, padding:0,
          }}
        >← ポータルに戻る</button>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:20, fontWeight:800 }}>💼 岡野家 資産管理</div>
            <div style={{ fontSize:28, fontWeight:900, color:"#fff", marginTop:2 }}>
              {fmtM(GRAND_TOTAL)}
            </div>
            <div style={{ fontSize:11, color: C.muted, marginTop:2 }}>
              {DATA_DATE} | 負債ネット済
            </div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:26, fontWeight:800, color: C.amber }}>
              {progress.toFixed(1)}%
            </div>
            <div style={{ fontSize:11, color: C.muted }}>残{yearsLeft}年</div>
          </div>
        </div>

        {/* 進捗バー */}
        <div style={{ marginTop:12 }}>
          <div style={{ background:"#1e2d45", borderRadius:999, height:10, overflow:"hidden" }}>
            <div style={{
              background:"linear-gradient(90deg,#3b82f6,#8b5cf6)",
              width:`${Math.min(progress, 100)}%`, height:"100%",
              borderRadius:999, transition:"width .5s",
            }}/>
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color: C.muted, marginTop:4 }}>
            <span>¥0</span>
            <span>¥2億（{GOAL_YEAR}年）</span>
          </div>
        </div>
      </div>

      {/* ── サブカード ── */}
      <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
        {[
          { label:"目標まで",  value: fmtM(GOAL - GRAND_TOTAL), sub:`毎年${fmtM(annualNeed)}必要`, color: C.amber },
          { label:"RF含み益",  value:`+${fmtM(RF_PNL)}`,        sub:"Robofolio分のみ",             color: C.green },
        ].map((c, i) => (
          <div key={i} style={{
            flex:1, minWidth:140, background: C.card,
            border:`1px solid ${c.color}33`, borderRadius:10, padding:"10px 14px",
          }}>
            <div style={{ fontSize:11, color: C.muted }}>{c.label}</div>
            <div style={{ fontSize:16, fontWeight:700, color:"#fff", marginTop:2 }}>{c.value}</div>
            <div style={{ fontSize:10, color: C.muted, marginTop:2 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── タブ ── */}
      <div style={{ display:"flex", gap:4, marginBottom:14, flexWrap:"wrap" }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            background: tab === t ? C.acc : C.card,
            color: tab === t ? "#fff" : C.muted,
            border: `1px solid ${tab === t ? C.acc : C.line}`,
            borderRadius:8, padding:"5px 10px", fontSize:11, cursor:"pointer",
          }}>{TAB_LABELS[t]}</button>
        ))}
      </div>

      {/* ── サマリタブ ── */}
      {tab === "summary" && (
        <div>
          {/* データソース別 */}
          <div style={{ background: C.card, borderRadius:10, padding:"12px 14px", marginBottom:12, border:`1px solid ${C.line}` }}>
            <div style={{ fontSize:11, color: C.muted, marginBottom:8 }}>データソース別 内訳</div>
            {[
              { label:"MoneyTree",    sub:"銀行/証券/iDeCo（USD換算込）", value: MT_TOTAL,   color:"#60a5fa" },
              { label:"MoneyForward", sub:"住信SBI専用（MT未収録）",       value: MF_UNIQUE,  color:"#a78bfa" },
              { label:"SonyLife",     sub:"解約返戻金2契約",               value: SONY_TOTAL, color:"#fb923c" },
            ].map((r, i) => (
              <div key={i} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"8px 0", borderBottom: i < 2 ? `1px solid ${C.line}` : "none",
              }}>
                <div>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ width:3, height:16, background: r.color, borderRadius:2, display:"inline-block" }}/>
                    <span style={{ fontSize:14, fontWeight:600 }}>{r.label}</span>
                  </div>
                  <div style={{ fontSize:11, color: C.muted, marginLeft:9 }}>{r.sub}</div>
                </div>
                <span style={{ fontSize:15, fontWeight:700 }}>{fmtM(r.value)}</span>
              </div>
            ))}
            <div style={{ fontSize:11, color: C.amber, marginTop:8 }}>
              ⚠️ 未取得: FX / 暗号資産 / SCBタイ口座
            </div>
          </div>

          {/* カテゴリ内訳 + パイチャート */}
          <div style={{ background: C.card, borderRadius:10, padding:"12px 14px", border:`1px solid ${C.line}` }}>
            <div style={{ fontSize:11, color: C.muted, marginBottom:8 }}>カテゴリ内訳</div>
            {pieData.map((d, i) => (
              <div key={i} style={{
                display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"6px 0", borderBottom: i < pieData.length - 1 ? `1px solid ${C.line}` : "none",
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ width:10, height:10, borderRadius:2, background: d.color, display:"inline-block" }}/>
                  <span style={{ fontSize:13 }}>{d.name}</span>
                </div>
                <span style={{ fontSize:13, fontWeight:600 }}>{fmtM(d.value)}</span>
              </div>
            ))}
            <div style={{ fontSize:11, color: C.green, marginTop:8 }}>
              証券含み益合計: +¥{RF_PNL.toLocaleString("ja-JP")}
            </div>
          </div>

          {/* パイチャート */}
          <div style={{ marginTop:12 }}>
            <div style={{ fontSize:11, color: C.muted, marginBottom:4 }}>資産配分</div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip formatter={(v) => fmtM(v)}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── 証券銘柄タブ ── */}
      {tab === "securities" && (
        <div>
          <div style={{ fontSize:11, color: C.muted, marginBottom:10 }}>
            Robofolio（SBI本人/妻 + 日興子供3名）| 合計 {fmtM(RF_TOTAL)} | 含み益
            <span style={{ color: C.green }}> +{fmtM(RF_PNL)}</span>
          </div>
          {["本人","妻","長女","次女","長男"].map(owner => {
            const items = RF_ITEMS.filter(i => i.owner === owner);
            if (!items.length) return null;
            const total = items.reduce((s, i) => s + i.amount, 0);
            const pnl   = items.reduce((s, i) => s + i.pnl,    0);
            return (
              <div key={owner} style={{ marginBottom:12 }}>
                <SectionHeader title={`${owner}（${items[0].acc}）`} total={total} pnl={pnl}/>
                <div style={{ overflowX:"auto" }}>
                  <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
                    <thead>
                      <tr style={{ color: C.muted, borderBottom:`1px solid ${C.line}` }}>
                        {["銘柄","区分","評価額","含み益"].map(h => (
                          <th key={h} style={{ textAlign:"left", padding:"4px 8px", fontWeight:400 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, i) => (
                        <tr key={i} style={{ borderBottom:`1px solid ${C.line}` }}>
                          <td style={{ padding:"5px 8px", color:"#cbd5e1", fontSize:11 }}>{it.name}</td>
                          <td style={{ padding:"5px 8px", color: C.muted, fontSize:11 }}>{it.sub}</td>
                          <td style={{ padding:"5px 8px", color:"#f1f5f9", textAlign:"right" }}>{fmtM(it.amount)}</td>
                          <td style={{ padding:"5px 8px", color: pnlColor(it.pnl), textAlign:"right" }}>
                            {it.pnl >= 0 ? "+" : ""}{fmt(it.pnl)}
                          </td>
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

      {/* ── 銀行口座タブ ── */}
      {tab === "banks" && (
        <div>
          <SectionHeader title="銀行・現金口座合計" total={BANK_TOTAL}/>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ color: C.muted, borderBottom:`1px solid ${C.line}` }}>
                {["口座名","名義","残高","ソース"].map(h => (
                  <th key={h} style={{ textAlign:"left", padding:"5px 8px", fontWeight:400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BANK_ITEMS.map((it, i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${C.line}` }}>
                  <td style={{ padding:"5px 8px", color:"#cbd5e1" }}>{it.name}</td>
                  <td style={{ padding:"5px 8px", color: C.muted }}>{it.owner}</td>
                  <td style={{ padding:"5px 8px", color:"#f1f5f9", textAlign:"right" }}>{fmtM(it.amount)}</td>
                  <td style={{ padding:"5px 8px" }}><Tag src={it.source}/></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{
            marginTop:10, padding:"8px 12px", background: C.card,
            borderRadius:8, fontSize:11, color: C.muted, border:`1px solid ${C.line}`,
          }}>
            ⚠️ 住信SBIはMoneyForward専用取得。2重計上なし。
          </div>
        </div>
      )}

      {/* ── 保険・iDeCoタブ ── */}
      {tab === "insurance" && (
        <div>
          <SectionHeader title="ソニー生命（解約返戻金）" total={SONY_TOTAL}/>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, marginBottom:16 }}>
            <thead>
              <tr style={{ color: C.muted, borderBottom:`1px solid ${C.line}` }}>
                {["契約","解約返戻金","払込保険料","損益"].map(h => (
                  <th key={h} style={{ textAlign:"left", padding:"5px 8px", fontWeight:400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SONY_ITEMS.map((it, i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${C.line}` }}>
                  <td style={{ padding:"5px 8px", color:"#cbd5e1" }}>{it.name} <Tag src="SL"/></td>
                  <td style={{ padding:"5px 8px", textAlign:"right" }}>{fmtM(it.amount)}</td>
                  <td style={{ padding:"5px 8px", color: C.muted, textAlign:"right" }}>{fmtM(it.cost)}</td>
                  <td style={{ padding:"5px 8px", color: pnlColor(it.amount - it.cost), textAlign:"right" }}>
                    {it.amount - it.cost >= 0 ? "+" : ""}{fmt(it.amount - it.cost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <SectionHeader title="iDeCo（MoneyForward詳細）" total={IDECO_TOTAL}/>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ color: C.muted, borderBottom:`1px solid ${C.line}` }}>
                {["銘柄","現在価値","含み益"].map(h => (
                  <th key={h} style={{ textAlign:"left", padding:"5px 8px", fontWeight:400 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {IDECO_ITEMS.map((it, i) => (
                <tr key={i} style={{ borderBottom:`1px solid ${C.line}` }}>
                  <td style={{ padding:"5px 8px", color:"#cbd5e1" }}>{it.name} <Tag src="MF"/></td>
                  <td style={{ padding:"5px 8px", textAlign:"right" }}>{fmt(it.amount)}</td>
                  <td style={{ padding:"5px 8px", color: pnlColor(it.pnl), textAlign:"right" }}>+{fmt(it.pnl)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── 未取得タブ ── */}
      {tab === "missing" && (
        <div>
          <div style={{ fontSize:12, color: C.muted, marginBottom:10 }}>
            以下は現在未取得。スクリプト完成後に順次追加予定。
          </div>
          {MISSING.map((m, i) => (
            <div key={i} style={{
              display:"flex", justifyContent:"space-between", alignItems:"center",
              padding:"10px 12px", background: C.card,
              borderRadius:8, marginBottom:6, border:`1px solid ${C.line}`,
            }}>
              <span style={{ color:"#f87171", fontSize:13 }}>⚠️ {m.name}</span>
              <span style={{ color: C.muted, fontSize:11 }}>{m.status}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── フッター ── */}
      <div style={{
        marginTop:20, fontSize:10, color: C.muted,
        textAlign:"center", borderTop:`1px solid ${C.line}`, paddingTop:12,
      }}>
        岡野一貴 資産管理 v2.0 | {DATA_DATE} | 次回自動取得: 平日 UTC 01:00
      </div>
    </div>
  );
}
