/**
 * 岡野ファミリー Apps ポータル
 * 全アプリへの入口ページ (Plan A: ウェルスナビ風 クリーン・ライト)
 */

const C = {
  bg: "#f8fafc",      // 清潔感のある青みのあるライトグレー
  card: "#ffffff",    // 純白のカード
  line: "#e2e8f0",    // スッキリとした薄い境界線
  text: "#0f172a",    // 洗練されたメイン文字（ネイビーブラック）
  muted: "#64748b",   // 控えめなラベル文字（チャコールグレー）
  acc: "#0052cc",     // ウェルスナビ風の上品なコーポレートブルー
  green: "#0284c7",   // 利益・ポジティブカラー（爽やかなシアンブルー）
  amber: "#b45309",   // 準備中など（ライト背景で視認性の高いアンバー）
  purple: "#7c3aed",  // 教育費など（深みのあるパープル）
};

const APPS = [
  {
    id:    "dashboard",
    icon:  "💼",
    name:  "資産ダッシュボード",
    desc:  "家族全員の資産を一元管理。推移グラフ・目標進捗",
    path:  "/dashboard",
    color: C.acc,
    ready: true,
  },
  {
    id:    "fx",
    icon:  "💱",
    name:  "FXトラッカー",
    desc:  "HFM / Exness / XM 取引履歴・損益・残高推移（2023-06〜）",
    path:  "/fx",
    color: C.green,
    ready: true,
  },
  {
    id:    "crypto",
    icon:  "🪙",
    name:  "暗号資産",
    desc:  "保有コイン・評価額の管理",
    path:  "/crypto",
    color: C.amber,
    ready: false,
  },
  {
    id:    "education",
    icon:  "🎓",
    name:  "教育費カレンダー",
    desc:  "子供3人の進学タイムライン・費用計画",
    path:  "/education",
    color: C.purple,
    ready: false,
  },
  {
    id:    "networth",
    icon:  "🏠",
    name:  "純資産サマリー",
    desc:  "不動産・退職金を含む総資産見通し",
    path:  "/networth",
    color: "#0d9488",
    ready: false,
  },
  {
    id:    "report",
    icon:  "📋",
    name:  "月次レポート",
    desc:  "月末自動生成レポート・AI分析",
    path:  "/report",
    color: "#db2777",
    ready: false,
  },
];

function getLastUpdated() {
  try {
    const raw = localStorage.getItem("okano-assets-v3");
    if (!raw) return null;
    const snaps = JSON.parse(raw);
    return snaps[snaps.length - 1]?.date || null;
  } catch {
    return null;
  }
}

export default function Portal() {
  // react-router-dom 不使用 → window.location で遷移
  const navigate    = (path) => { window.location.href = path; };
  const lastUpdated = getLastUpdated();
  const now         = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });

  return (
    <div style={{
      background: C.bg, minHeight: "100vh", color: C.text,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>

      {/* ── ヘッダー ── */}
      <div style={{
        background: C.card, padding: "24px 20px 20px",
        borderBottom: `1px solid ${C.line}`,
        boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 600 }}>
              Okano Family
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-.02em", marginTop: 4, color: C.text }}>
              🏠 Apps Portal
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 11, color: C.muted, fontFamily: "monospace" }}>
            <div>{now}</div>
            {lastUpdated && <div style={{ color: C.green, marginTop: 4, fontWeight: 600 }}>✓ 資産 {lastUpdated}</div>}
          </div>
        </div>
      </div>

      {/* ── アプリグリッド ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 16, padding: 20,
      }}>
        {APPS.map(app => (
          <div
            key={app.id}
            onClick={() => app.ready && navigate(app.path)}
            style={{
              background: C.card,
              border: `1px solid ${C.line}`,
              borderRadius: 16,
              padding: "20px 16px",
              cursor: app.ready ? "pointer" : "default",
              opacity: app.ready ? 1 : 0.6,
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)",
              transition: "transform .2s, box-shadow .2s, border-color .2s",
              position: "relative",
            }}
            onMouseEnter={e => { 
              if (app.ready) { 
                e.currentTarget.style.transform = "translateY(-4px)"; 
                e.currentTarget.style.boxShadow = `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)`; 
                e.currentTarget.style.borderColor = app.color;
              } 
            }}
            onMouseLeave={e => { 
              e.currentTarget.style.transform = "none"; 
              e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)"; 
              e.currentTarget.style.borderColor = C.line;
            }}
          >
            <div style={{
              fontSize: 24, marginBottom: 14,
              width: 48, height: 48, borderRadius: 12,
              background: app.color + "12",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {app.icon}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: C.text }}>
              {app.name}
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
              {app.desc}
            </div>
            {!app.ready && (
              <div style={{
                position: "absolute", top: 12, right: 12,
                background: "#f1f5f9", color: C.muted,
                fontSize: 10, padding: "2px 8px", borderRadius: 999,
                fontWeight: 500, border: `1px solid ${C.line}`
              }}>
                準備中
              </div>
            )}
            {app.ready && (
              <div style={{
                marginTop: 14, display: "flex", alignItems: "center", gap: 4,
                fontSize: 12, color: app.color, fontWeight: 600,
              }}>
                <span>開く</span>
                <span>→</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── フッター ── */}
      <div style={{
        padding: "24px 20px", textAlign: "center",
        fontSize: 11, color: C.muted, borderTop: `1px solid ${C.line}`, marginTop: 16,
      }}>
        岡野ファミリー Apps | データは端末内に保存 | 平日 UTC 01:00 自動更新
      </div>
    </div>
  );
}