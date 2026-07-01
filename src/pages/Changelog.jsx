/**
 * Changelog.jsx — バージョン更新履歴
 * 新バージョンリリース時に CHANGELOG_DATA に追記してください。
 */
import { useState, useEffect } from "react";

const getColors = (isDark) => ({
  bg:    isDark ? "#0a0f1a" : "#f8fafc",
  card:  isDark ? "#121c2e" : "#ffffff",
  line:  isDark ? "#1e2d45" : "#e2e8f0",
  text:  isDark ? "#e2e8f0" : "#0f172a",
  muted: isDark ? "#4a6080" : "#64748b",
  acc:   "#0052cc",
  green: "#0284c7",
  amber: isDark ? "#f59e0b" : "#b45309",
  red:   "#ea580c",
  purple:isDark ? "#a78bfa" : "#7c3aed",
});

// ── 更新履歴データ（新しいバージョンを先頭に追記してください）──
const CHANGELOG_DATA = [
  {
    version: "v3.1",
    date: "2026/07/01",
    title: "銀行/外貨タブ刷新・全テーブル並び替え・セキュリティ対応",
    tags: ["機能追加", "UI改善", "バグ修正", "セキュリティ"],
    items: [
      { type: "feat",  text: "全タブのテーブル列ヘッダークリックで並び替え対応（文字列=50音/英字、数値=大小、日付=新旧）" },
      { type: "feat",  text: "全ページの日付表示をyyyy/mm/dd形式に統一（グラフ軸ラベル含む）" },
      { type: "feat",  text: "銀行/外貨タブ：円・米ドル・タイバーツ資産のカードに「+ 現金手入力」機能を追加（名称・金額・日付・履歴管理）" },
      { type: "feat",  text: "タイバーツレートをfrankfurter.app APIでライブ取得。取得失敗時は1THB=4.15円（仮）で自動フォールバック" },
      { type: "feat",  text: "米ドル資産テーブル：名称・最終更新日・取得元を追加。名義列を削除" },
      { type: "feat",  text: "銀行資産テーブル：ヘッダーを「銀行・現金資産」に変更、住信の最終更新日をyyyy/mm/dd形式で表示" },
      { type: "feat",  text: "ポータル前にパスワードログイン画面を設置（SHA-256ハッシュ認証）" },
      { type: "feat",  text: "パスワード変更画面を追加（GitHub API経由でhash更新、PAT保存なし）" },
      { type: "feat",  text: "本ページ（更新履歴）をポータルから参照可能に" },
      { type: "fix",   text: "米ドルMMF・現金の本人（KAZ）分が抽出できていなかったバグを修正（口座コードアンカー方式に変更）" },
      { type: "fix",   text: "米ドル資産にKAZ・NAN各自の最終更新日を正確に紐づけ（従来は順番依存で誤紐づけ）" },
      { type: "feat",  text: "米ドル資産：米国株式（NISA/一般/特定預り）の抽出を追加" },
      { type: "feat",  text: "サマリーカードクリックで対応タブへジャンプ" },
      { type: "feat",  text: "外貨サマリーカードに$マークを追加" },
    ],
  },
  {
    version: "v3.0",
    date: "2026/06/30",
    title: "自動化パイプライン完成・Dashboard全面刷新",
    tags: ["機能追加", "自動化"],
    items: [
      { type: "feat", text: "Windowsタスクスケジューラによる毎朝自動実行（平日10:00）" },
      { type: "feat", text: "robofolio.py / moneytree.py / moneyforward.py / sonylife.py → build_assets_json.py による一気通貫パイプライン" },
      { type: "feat", text: "Dashboard.jsx：ハードコードデータ廃止、public/data/assets_latest.jsonを実行時fetchする方式に移行" },
      { type: "feat", text: "ソニー生命最新解約返戻金・iDeCo取得コストの表示" },
      { type: "feat", text: "JA共済（個人年金）を総資産に追加。二段階複利計算UIとアーカイブ機能" },
      { type: "feat", text: "住信SBIネット銀行の最終更新日表示（MoneyForward連携）" },
      { type: "feat", text: "USD/JPYレートをfrankfurter.app APIでライブ取得" },
      { type: "feat", text: "💹 投資リターンタブ追加（取得コスト vs 現在評価額の比較）" },
      { type: "feat", text: "update_history.py による04_HISTORY/asset_history.csvへの履歴蓄積" },
      { type: "feat", text: "FX取引履歴ダッシュボード（HFM/Exness/XM）をポータルから参照可能に" },
    ],
  },
  {
    version: "v2.x",
    date: "2026/05〜06",
    title: "FXダッシュボード・ポータル整備",
    tags: ["機能追加"],
    items: [
      { type: "feat", text: "FXDashboard.jsx 新設（HFM・Exness・XM Trading 取引履歴266件）" },
      { type: "feat", text: "Portal.jsx 整備（アプリ一覧・準備中ステータス管理）" },
      { type: "feat", text: "ダーク/ライトモード切り替え（localStorage保持）" },
    ],
  },
  {
    version: "v1.x",
    date: "2026/04〜05",
    title: "資産ダッシュボード初期版",
    tags: ["初期リリース"],
    items: [
      { type: "feat", text: "React + Vite + GitHub Pages環境の構築" },
      { type: "feat", text: "SBI/日興証券 保有銘柄表示（Robofolio連携）" },
      { type: "feat", text: "銀行口座残高・iDeCo・ソニー生命の手入力管理" },
      { type: "feat", text: "円グラフによる資産配分の可視化" },
    ],
  },
];

const TYPE_STYLE = {
  feat:  { bg: "#dbeafe", text: "#1d4ed8", label: "追加" },
  fix:   { bg: "#dcfce7", text: "#15803d", label: "修正" },
  break: { bg: "#fee2e2", text: "#b91c1c", label: "破壊的変更" },
};

export default function Changelog() {
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    setTheme(localStorage.getItem("okano-app-theme") || "light");
  }, []);
  const isDark = theme === "dark";
  const C = getColors(isDark);

  return (
    <div style={{
      background: C.bg, minHeight: "100vh", color: C.text,
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      paddingBottom: 60,
    }}>
      {/* ヘッダー */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.line}`, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => { window.location.href = "/"; }}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              padding: "6px 12px", borderRadius: 8,
              border: `1px solid ${C.line}`, background: C.bg,
              fontSize: 12, color: C.muted, cursor: "pointer",
              fontWeight: 600, transition: "all 0.2s"
            }}>
            ← ポータルへ
          </button>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>📋 更新履歴</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>岡野ファミリー 資産管理ポータル — バージョン履歴</div>
          </div>
        </div>
        <button onClick={() => {
          const n = isDark ? "light" : "dark";
          setTheme(n);
          localStorage.setItem("okano-app-theme", n);
        }} style={{
          background: isDark ? "#1e2d45" : "#f1f5f9", border: "none", borderRadius: 20,
          color: C.muted, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer",
        }}>
          {isDark ? "☀️ LIGHT" : "🌙 DARK"}
        </button>
      </div>

      <div style={{ padding: "20px 20px 0", maxWidth: 720 }}>
        {CHANGELOG_DATA.map((v, vi) => (
          <div key={v.version} style={{ position: "relative", paddingLeft: 24, marginBottom: 40 }}>
            {/* タイムラインライン */}
            {vi < CHANGELOG_DATA.length - 1 && (
              <div style={{
                position: "absolute", left: 7, top: 24, bottom: -24,
                width: 2, background: C.line,
              }} />
            )}
            {/* タイムラインドット */}
            <div style={{
              position: "absolute", left: 0, top: 12,
              width: 14, height: 14, borderRadius: 7,
              background: vi === 0 ? C.acc : C.line,
              border: `2px solid ${vi === 0 ? C.acc : C.muted}`,
            }} />

            {/* バージョンカード */}
            <div style={{ background: C.card, border: `1px solid ${vi === 0 ? C.acc : C.line}`, borderRadius: 14, padding: "16px 18px", boxShadow: vi === 0 ? `0 0 0 2px ${C.acc}22` : "0 2px 4px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: vi === 0 ? C.acc : C.text }}>{v.version}</span>
                <span style={{ fontSize: 12, color: C.muted }}>{v.date}</span>
                {vi === 0 && (
                  <span style={{ background: C.acc, color: "#fff", fontSize: 10, fontWeight: 700, borderRadius: 4, padding: "2px 7px" }}>最新</span>
                )}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 10 }}>{v.title}</div>

              {/* タグ */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {v.tags.map(t => (
                  <span key={t} style={{
                    background: isDark ? "#1e2d45" : "#f1f5f9", color: C.muted,
                    fontSize: 10, fontWeight: 600, borderRadius: 4, padding: "2px 8px",
                    border: `1px solid ${C.line}`,
                  }}>{t}</span>
                ))}
              </div>

              {/* 変更リスト */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {v.items.map((item, i) => {
                  const style = TYPE_STYLE[item.type] || TYPE_STYLE.feat;
                  return (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{
                        background: style.bg, color: style.text,
                        fontSize: 10, fontWeight: 700, borderRadius: 4, padding: "2px 6px",
                        minWidth: 30, textAlign: "center", marginTop: 1, flexShrink: 0,
                      }}>{style.label}</span>
                      <span style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>{item.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
