/**
 * Login.jsx — パスワードログイン画面
 * 認証方式: SHA-256ハッシュ比較（クライアントサイド）
 * パスワードハッシュ: public/config/auth.json に保存（GitHubにコミット済み）
 * セッション: sessionStorage に保存（ブラウザを閉じると失去）
 */
import { useState, useEffect } from "react";

const SESSION_KEY = "okano-auth-session";
const AUTH_PATH   = "/config/auth.json";

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function isAuthenticated() {
  return sessionStorage.getItem(SESSION_KEY) === "true";
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.href = "/";
}

const getColors = (isDark) => ({
  bg:   isDark ? "#0a0f1a" : "#f8fafc",
  card: isDark ? "#121c2e" : "#ffffff",
  line: isDark ? "#1e2d45" : "#e2e8f0",
  text: isDark ? "#e2e8f0" : "#0f172a",
  muted:isDark ? "#4a6080" : "#64748b",
  acc:  "#0052cc",
  red:  "#dc2626",
});

export default function Login() {
  const [theme,  setTheme]  = useState("light");
  const [pw,     setPw]     = useState("");
  const [error,  setError]  = useState("");
  const [loading,setLoading]= useState(false);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("okano-app-theme") || "light";
    setTheme(t);
    if (isAuthenticated()) window.location.href = "/";
  }, []);

  const isDark = theme === "dark";
  const C = getColors(isDark);

  const handleLogin = async () => {
    if (!pw) { setError("パスワードを入力してください"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(AUTH_PATH + "?t=" + Date.now());
      if (!res.ok) throw new Error("auth.json が見つかりません");
      const { hash } = await res.json();
      const entered = await sha256(pw);
      if (entered === hash) {
        sessionStorage.setItem(SESSION_KEY, "true");
        window.location.href = "/";
      } else {
        setError("パスワードが正しくありません");
        setPw("");
      }
    } catch (e) {
      setError("認証情報の読み込みに失敗しました: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") handleLogin(); };

  const inp = {
    width: "100%", padding: "12px 16px", fontSize: 16, borderRadius: 10,
    border: `1px solid ${error ? C.red : C.line}`, background: isDark ? "#1e2d45" : "#f8fafc",
    color: C.text, boxSizing: "border-box", outline: "none",
  };

  return (
    <div style={{
      background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{
        background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: "40px 36px",
        width: "100%", maxWidth: 360, boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
      }}>
        {/* ロゴ */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🏠</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>岡野ファミリー</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>資産管理ポータル</div>
        </div>

        {/* 入力欄 */}
        <div style={{ marginBottom: 16, position: "relative" }}>
          <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, display: "block", marginBottom: 6 }}>
            パスワード
          </label>
          <div style={{ position: "relative" }}>
            <input
              type={showPw ? "text" : "password"}
              value={pw}
              onChange={(e) => { setPw(e.target.value); setError(""); }}
              onKeyDown={handleKeyDown}
              placeholder="パスワードを入力"
              style={inp}
              autoFocus
            />
            <button
              onClick={() => setShowPw((s) => !s)}
              style={{
                position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 13,
              }}
            >
              {showPw ? "隠す" : "表示"}
            </button>
          </div>
          {error && (
            <div style={{ color: C.red, fontSize: 12, marginTop: 6, fontWeight: 500 }}>⚠️ {error}</div>
          )}
        </div>

        {/* ログインボタン */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%", padding: "13px", fontSize: 15, fontWeight: 700,
            background: loading ? C.muted : C.acc, color: "#fff", border: "none",
            borderRadius: 10, cursor: loading ? "not-allowed" : "pointer",
            transition: "background 0.2s",
          }}
        >
          {loading ? "認証中..." : "ログイン"}
        </button>

        {/* パスワード変更リンク */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <a
            href="/change-password"
            style={{ fontSize: 12, color: C.muted, textDecoration: "none", borderBottom: `1px solid ${C.line}` }}
          >
            パスワード変更はこちら
          </a>
        </div>

        {/* テーマ切り替え */}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button
            onClick={() => {
              const n = isDark ? "light" : "dark";
              setTheme(n);
              localStorage.setItem("okano-app-theme", n);
            }}
            style={{
              background: "none", border: "none", color: C.muted,
              fontSize: 12, cursor: "pointer",
            }}
          >
            {isDark ? "☀️ ライトモード" : "🌙 ダークモード"}
          </button>
        </div>
      </div>
    </div>
  );
}
