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
export const CHANGELOG_DATA = [
  {
    version: "v3.4",
    date: "2026/07/02",
    title: "自動同期対応・手入力現金の編集機能・設定タブ追加",
    tags: ["機能追加", "バグ修正"],
    items: [
      { type: "fix",  text: "デバイス間で同期する際、常に新しいタイムスタンプが発行され上書きされる不具合を修正" },
      { type: "feat", text: "フッターの同期モーダルを廃止し、独立した「⚙️ 設定」タブを追加してGitHub PAT等を管理" },
      { type: "feat", text: "GitHub PATの保存先をセッションからlocalStorageに変更（ブラウザを閉じても維持）" },
      { type: "feat", text: "手入力現金の追加・編集・削除時や除外設定変更時に、自動的にGistへ同期されるバックグラウンド自動同期を実装" },
      { type: "feat", text: "銀行・米ドル・バーツ資産の手入力現金に「編集」「削除」ボタンを追加し、インラインでの編集を可能に" },
    ],
  },
  {
    version: "v3.3",
    date: "2026/07/01",
    title: "積立設定統合・アーカイブ機能強化・デバイス間同期",
    tags: ["機能追加", "UI改善"],
    items: [
      { type: "feat", text: "積立設定管理を資産ダッシュボード証券銘柄タブ内に移動。折りたたみ式UIで合計サマリーを常時表示" },
      { type: "feat", text: "銀行/外貨タブ：米ドル・タイバーツ資産テーブルにアーカイブ列（除外ボタン）を追加" },
      { type: "feat", text: "銀行・現金資産/米ドル/タイバーツ 全テーブルにアーカイブ表示/非表示切り替えボタンを設置" },
      { type: "feat", text: "GitHub Gist APIを使ったデバイス間同期機能を追加。最終更新タイムスタンプが新しい方を採用" },
      { type: "feat", text: "フッターのバージョン表示を更新履歴ページと動的同期。名称を「資産管理App」に変更" },
      { type: "fix",  text: "積立設定ページを独立ページからダッシュボード内コンポーネントに移動し旧/savingsルートを廃止" },
    ],
  },
  {
    version: "v3.2",
    date: "2026/07/01",
    title: "不具合修正・UI統一",
    tags: ["UI改善", "バグ修正"],
    items: [
      { type: "fix",  text: "資産ダッシュボード描画時の一部変数の未定義エラーによる真っ暗な画面（クラッシュ）を修正" },
      { type: "feat", text: "積立設定管理・更新履歴ページのヘッダーデザインをFXトラッカーと同一の90pxアクセントバー仕様に統一" },
      { type: "fix",  text: "ダッシュボードの表示における年次・月次推移の表示切替バグを修正" },
      { type: "fix",  text: "米ドル・タイバーツテーブルのスマホ表示時のレイアウト崩れ（横スクロール対応）を修正" },
      { type: "feat", text: "保険・個人年金タブにて、ソニー生命とJA共済を統合した「保険・個人年金」タイトルに変更" },
      { type: "feat", text: "保険・個人年金タブにて、「手動追加分」セクションを独立させてUIを改善" },
      { type: "feat", text: "ソニー生命の契約行にも「アーカイブ」機能を追加し、合計金額から除外できるように改善" },
    ],
  },
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
      {/* ── スマホ画面上部の押し下げ用アクセントバー（高さを2.5倍の90pxに拡張＆ボタン位置調整） ── */}
      <div style={{ 
        background: C.acc, 
        height: "90px", 
        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        padding: "0 16px 14px 16px",
        boxSizing: "border-box"
      }}>
        <button
          onClick={() => { window.location.href = "/"; }}
          style={{
            display: "flex", alignItems: "center", gap: 4,
            padding: "6px 12px", borderRadius: 8,
            border: `1px solid rgba(255,255,255,0.3)`, background: "rgba(255, 255, 255, 0.2)",
            fontSize: 12, color: "#ffffff", cursor: "pointer",
            fontWeight: 700, transition: "all 0.2s"
          }}
        >
          ← ポータルへ
        </button>
        <button 
          onClick={() => {
            const n = isDark ? "light" : "dark";
            setTheme(n);
            localStorage.setItem("okano-app-theme", n);
          }}
          style={{
            background: "rgba(255, 255, 255, 0.2)",
            border: "none",
            borderRadius: "20px",
            color: "#fff",
            padding: "6px 16px",
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

      {/* ヘッダー */}
      <div style={{ background: C.card, borderBottom: `1px solid ${C.line}`, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: "-0.5px" }}>更新履歴</div>
          </div>
        </div>
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
