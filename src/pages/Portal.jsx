/**
 * 岡野ファミリー Apps ポータル
 * 全アプリへの入口ページ (Plan A/B: テーマ切り替え＆全画面同期対応版)
 */
import { useState, useEffect } from "react";

// ================================================================
// テーマカラー動的定義
// ================================================================
const getColors = (isDark) => ({
  bg: isDark ? "#0a0f1a" : "#f8fafc",      // 背景（深ネイビー / 薄グレー）
  card: isDark ? "#121c2e" : "#ffffff",    // カード（ダークネイビー / 純白）
  line: isDark ? "#1e2d45" : "#e2e8f0",    // 境界線
  text: isDark ? "#e2e8f0" : "#0f172a",    // メイン文字
  muted: isDark ? "#4a6080" : "#64748b",   // 補助文字
  acc: "#0052cc",     // コーポレートブルー（共通）
  green: "#0284c7",   // シアンブルー（共通）
  amber: isDark ? "#f59e0b" : "#b45309",   // アンバー
  purple: isDark ? "#a78bfa" : "#7c3aed",  // パープル
  teal: isDark ? "#2dd4bf" : "#0d9488",    // 純資産用
  pink: isDark ? "#f472b6" : "#db2777",    // レポート用
});

// ミニマルなインラインSVGアイコンコンポーネント
const Icons = {
  dashboard: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" />
      <rect x="14" y="3" width="7" height="5" />
      <rect x="14" y="12" width="7" height="9" />
      <rect x="3" y="16" width="7" height="5" />
    </svg>
  ),
  fx: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5z" />
    </svg>
  ),
  crypto: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="12" y1="12" x2="16" y2="12" />
    </svg>
  ),
  education: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
  ),
  networth: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  report: (color) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
};

const APPS = [
  { id: "dashboard", icon: "dashboard", name: "資産ダッシュボード", desc: "家族全員の資産を一元管理。推移グラフ・目標進捗", path: "/dashboard", colorKey: "acc", ready: true },
  { id: "fx", icon: "fx", name: "FXトラッカー", desc: "HFM / Exness / XM 取引履歴・損益・残高推移（2023-06〜）", path: "/fx", colorKey: "green", ready: true },
  { id: "crypto", icon: "crypto", name: "暗号資産", desc: "保有コイン・評価額の管理", path: "/crypto", colorKey: "amber", ready: false },
  { id: "education", icon: "education", name: "教育費カレンダー", desc: "子供3人の進学タイムライン・費用計画", path: "/education", colorKey: "purple", ready: false },
  { id: "networth", icon: "networth", name: "純資産サマリー", desc: "不動産・退職金を含む総資産見通し", path: "/networth", colorKey: "teal", ready: false },
  { id: "report", icon: "report", name: "月次レポート", desc: "月末自動生成レポート・AI分析", path: "/report", colorKey: "pink", ready: false },
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
  const [theme, setTheme] = useState("light");

  // 初回起動時に保存されたテーマを読み込む
  useEffect(() => {
    const savedTheme = localStorage.getItem("okano-app-theme") || "light";
    setTheme(savedTheme);
  }, []);

  // テーマ切り替え処理＆保存
  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("okano-app-theme", nextTheme);
  };

  const isDark = theme === "dark";
  const C = getColors(isDark);

  const navigate    = (path) => { window.location.href = path; };
  const lastUpdated = getLastUpdated();
  const now         = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });

  return (
    <div style={{
      background: C.bg, minHeight: "100vh", color: C.text,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      transition: "background 0.3s, color 0.3s"
    }}>

      {/* ── スマホ画面上部の押し下げ用アクセントバー ＋ 切り替えスイッチ ── */}
      <div style={{ 
        background: C.acc, 
        height: "36px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        padding: "0 16px"
      }}>
        <button 
          onClick={toggleTheme}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            borderRadius: "20px",
            color: "#fff",
            padding: "4px 12px",
            fontSize: "11px",
            fontWeight: "600",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            outline: "none"
          }}
        >
          {isDark ? "☀️ LIGHT" : "🌙 DARK"}
        </button>
      </div>

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
        {APPS.map(app => {
          const appColor = C[app.colorKey];
          return (
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
                boxShadow: isDark ? "0 4px 6px -1px rgba(0,0,0,0.5)" : "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                transition: "transform .2s, box-shadow .2s, border-color .2s",
                position: "relative",
              }}
              onMouseEnter={e => { 
                if (app.ready) { 
                  e.currentTarget.style.transform = "translateY(-4px)"; 
                  e.currentTarget.style.boxShadow = `0 10px 15px -3px rgba(0, 0, 0, 0.2)`; 
                  e.currentTarget.style.borderColor = appColor;
                } 
              }}
              onMouseLeave={e => { 
                e.currentTarget.style.transform = "none"; 
                e.currentTarget.style.boxShadow = isDark ? "0 4px 6px -1px rgba(0,0,0,0.5)" : "0 4px 6px -1px rgba(0, 0, 0, 0.05)"; 
                e.currentTarget.style.borderColor = C.line;
              }}
            >
              <div style={{
                marginBottom: 14,
                width: 44, height: 44, borderRadius: 12,
                background: appColor + (isDark ? "22" : "0d"),
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {Icons[app.icon](appColor)}
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
                  background: isDark ? "#1e2d45" : "#f1f5f9", 
                  color: C.muted,
                  fontSize: 10, padding: "2px 8px", borderRadius: 999,
                  fontWeight: 500, border: `1px solid ${C.line}`
                }}>
                  準備中
                </div>
              )}
              {app.ready && (
                <div style={{
                  marginTop: 14, display: "flex", alignItems: "center", gap: 4,
                  fontSize: 12, color: appColor, fontWeight: 600,
                }}>
                  <span>開く</span>
                  <span>→</span>
                </div>
              )}
            </div>
          );
        })}
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