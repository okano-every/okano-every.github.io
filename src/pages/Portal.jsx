/**
 * 岡野ファミリー Apps ポータル
 * 全アプリへの入口ページ
 */
import { useNavigate } from "react-router-dom";

const C = {
  bg: "#0a0f1a", card: "#121c2e", line: "#1e2d45",
  text: "#e2e8f0", muted: "#4a6080",
  acc: "#3b82f6", green: "#22c55e", amber: "#f59e0b", purple: "#8b5cf6",
};

// ── アプリ定義（追加するたびここに足す）─────────────────
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
    desc:  "XM Trading / EXNESS の評価額・損益",
    path:  "/fx",
    color: C.green,
    ready: false,
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
    color: "#14b8a6",
    ready: false,
  },
  {
    id:    "report",
    icon:  "📋",
    name:  "月次レポート",
    desc:  "月末自動生成レポート・AI分析",
    path:  "/report",
    color: "#f472b6",
    ready: false,
  },
];

// ── 最終更新日（localStorage から取得）───────────────────
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
  const navigate    = useNavigate();
  const lastUpdated = getLastUpdated();
  const now         = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });

  return (
    <div style={{
      background: C.bg, minHeight: "100vh", color: C.text,
      fontFamily: "-apple-system, 'Helvetica Neue', sans-serif",
    }}>

      {/* ── ヘッダー ── */}
      <div style={{
        background: C.card, padding: "20px 20px 16px",
        borderBottom: `1px solid ${C.line}`,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: ".1em", textTransform: "uppercase" }}>
              Okano Family
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", marginTop: 4 }}>
              🏠 Apps Portal
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: 10, color: C.muted }}>
            <div>{now}</div>
            {lastUpdated && <div style={{ color: C.green, marginTop: 2 }}>✓ 資産 {lastUpdated}</div>}
          </div>
        </div>
      </div>

      {/* ── アプリグリッド ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: 12, padding: 16,
      }}>
        {APPS.map(app => (
          <div
            key={app.id}
            onClick={() => app.ready && navigate(app.path)}
            style={{
              background: C.card,
              border: `1px solid ${app.ready ? app.color + "44" : C.line}`,
              borderRadius: 14,
              padding: "16px 14px",
              cursor: app.ready ? "pointer" : "default",
              opacity: app.ready ? 1 : 0.55,
              transition: "transform .15s, box-shadow .15s",
              position: "relative",
            }}
            onMouseEnter={e => { if (app.ready) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 24px ${app.color}22`; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}
          >
            {/* アイコン */}
            <div style={{
              fontSize: 28, marginBottom: 10,
              width: 48, height: 48, borderRadius: 12,
              background: app.color + "22",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {app.icon}
            </div>

            {/* アプリ名 */}
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: C.text }}>
              {app.name}
            </div>

            {/* 説明 */}
            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
              {app.desc}
            </div>

            {/* 準備中バッジ */}
            {!app.ready && (
              <div style={{
                position: "absolute", top: 10, right: 10,
                background: C.line, color: C.muted,
                fontSize: 9, padding: "2px 6px", borderRadius: 999,
              }}>
                準備中
              </div>
            )}

            {/* 利用可能バッジ */}
            {app.ready && (
              <div style={{
                marginTop: 10, display: "flex", alignItems: "center", gap: 4,
                fontSize: 11, color: app.color, fontWeight: 600,
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
        padding: "16px 20px", textAlign: "center",
        fontSize: 10, color: C.muted, borderTop: `1px solid ${C.line}`, marginTop: 8,
      }}>
        岡野ファミリー Apps | データは端末内に保存 | 平日 UTC 01:00 自動更新
      </div>
    </div>
  );
}
