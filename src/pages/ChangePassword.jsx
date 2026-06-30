/**
 * ChangePassword.jsx — パスワード変更画面
 *
 * 仕組み:
 * 1. 現在のパスワードを確認（auth.jsonのハッシュと照合）
 * 2. 新しいパスワードのSHA-256ハッシュを生成
 * 3. GitHub API経由でpublic/config/auth.jsonを更新（PAT必要）
 *    → PAT は入力後すぐ使用するだけで保存しない
 *    → GitHubに保存されるのはハッシュのみ（平文パスワードは保存されない）
 */
import { useState, useEffect } from "react";

const AUTH_PATH   = "/config/auth.json";
const GITHUB_OWNER = "okano-every";
const GITHUB_REPO  = "okano-every.github.io";
const AUTH_FILE_PATH = "public/config/auth.json";

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

const getColors = (isDark) => ({
  bg:    isDark ? "#0a0f1a" : "#f8fafc",
  card:  isDark ? "#121c2e" : "#ffffff",
  line:  isDark ? "#1e2d45" : "#e2e8f0",
  text:  isDark ? "#e2e8f0" : "#0f172a",
  muted: isDark ? "#4a6080" : "#64748b",
  acc:   "#0052cc",
  green: "#0284c7",
  red:   "#dc2626",
});

export default function ChangePassword() {
  const [theme,   setTheme]   = useState("light");
  const [curPw,   setCurPw]   = useState("");
  const [newPw,   setNewPw]   = useState("");
  const [newPw2,  setNewPw2]  = useState("");
  const [pat,     setPat]     = useState("");
  const [step,    setStep]    = useState(1); // 1=入力 / 2=PAT / 3=完了
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [newHash, setNewHash] = useState("");

  useEffect(() => {
    const t = localStorage.getItem("okano-app-theme") || "light";
    setTheme(t);
  }, []);

  const isDark = theme === "dark";
  const C = getColors(isDark);

  const inp = {
    width: "100%", padding: "11px 14px", fontSize: 14, borderRadius: 10,
    border: `1px solid ${C.line}`, background: isDark ? "#1e2d45" : "#f8fafc",
    color: C.text, boxSizing: "border-box", outline: "none", marginTop: 4,
  };

  const Field = ({ label, value, onChange, placeholder }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{label}</label>
      <input type="password" value={value} onChange={(e) => { onChange(e.target.value); setError(""); }}
        placeholder={placeholder} style={inp} />
    </div>
  );

  // STEP 1: パスワード検証 + 新パスワードハッシュ生成
  const handleVerify = async () => {
    if (!curPw || !newPw || !newPw2) { setError("すべて入力してください"); return; }
    if (newPw !== newPw2) { setError("新しいパスワードが一致しません"); return; }
    if (newPw.length < 6) { setError("パスワードは6文字以上にしてください"); return; }
    setLoading(true);
    try {
      const res = await fetch(AUTH_PATH + "?t=" + Date.now());
      if (!res.ok) throw new Error("auth.json の読み込みに失敗");
      const { hash } = await res.json();
      const curHash = await sha256(curPw);
      if (curHash !== hash) { setError("現在のパスワードが正しくありません"); return; }
      const h = await sha256(newPw);
      setNewHash(h);
      setStep(2);
    } catch (e) {
      setError("エラー: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: GitHub API で auth.json を更新
  const handleUpdate = async () => {
    if (!pat) { setError("GitHub Personal Access Tokenを入力してください"); return; }
    setLoading(true);
    try {
      const base = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${AUTH_FILE_PATH}`;
      const headers = {
        Authorization: `Bearer ${pat}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      };
      // 既存ファイルのSHAを取得
      const getRes = await fetch(base, { headers });
      if (!getRes.ok) throw new Error(`ファイル取得失敗 (${getRes.status}) — PATのscopeを確認してください`);
      const { sha } = await getRes.json();
      // 新しいコンテンツをbase64エンコード
      const newContent = JSON.stringify({ hash: newHash, hint: "SHA-256" }, null, 2) + "\n";
      const encoded = btoa(unescape(encodeURIComponent(newContent)));
      const putRes = await fetch(base, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: "security: update password hash",
          content: encoded,
          sha,
        }),
      });
      if (!putRes.ok) {
        const d = await putRes.json();
        throw new Error(d.message || `更新失敗 (${putRes.status})`);
      }
      setStep(3);
    } catch (e) {
      setError("GitHubの更新に失敗しました: " + e.message);
    } finally {
      setLoading(false);
      setPat(""); // PATは即座に消去
    }
  };

  return (
    <div style={{
      background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      <div style={{
        background: C.card, border: `1px solid ${C.line}`, borderRadius: 20, padding: "36px",
        width: "100%", maxWidth: 400, boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
      }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>🔑 パスワード変更</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
            {step === 1 && "現在と新しいパスワードを入力してください"}
            {step === 2 && "GitHub PATで変更を確定します"}
            {step === 3 && "パスワードが変更されました"}
          </div>
        </div>

        {/* ステップインジケーター */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {[1,2,3].map(s => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: s <= step ? C.acc : C.line,
            }} />
          ))}
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: C.red, marginBottom: 16 }}>
            ⚠️ {error}
          </div>
        )}

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <Field label="現在のパスワード" value={curPw} onChange={setCurPw} placeholder="現在のパスワード" />
            <Field label="新しいパスワード（6文字以上）" value={newPw} onChange={setNewPw} placeholder="新しいパスワード" />
            <Field label="新しいパスワード（確認）" value={newPw2} onChange={setNewPw2} placeholder="もう一度入力" />
            <button onClick={handleVerify} disabled={loading} style={{
              width: "100%", padding: "12px", fontSize: 14, fontWeight: 700,
              background: C.acc, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", marginTop: 8,
            }}>
              {loading ? "確認中..." : "次へ →"}
            </button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <div style={{ background: isDark ? "#1e2d45" : "#eff6ff", borderRadius: 10, padding: "14px", marginBottom: 16, fontSize: 12, color: C.muted }}>
              <div style={{ fontWeight: 700, color: C.text, marginBottom: 6 }}>🔒 セキュリティについて</div>
              <div>GitHubに保存されるのは <strong>パスワードのハッシュ値のみ</strong>です。</div>
              <div style={{ marginTop: 4 }}>PATはこの更新処理にのみ使用し、保存しません。</div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>
                GitHub Personal Access Token（repoスコープ）
              </label>
              <input type="password" value={pat} onChange={(e) => { setPat(e.target.value); setError(""); }}
                placeholder="ghp_xxxxxxxxxxxx" style={inp} />
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                GitHub → Settings → Developer settings → Personal access tokens
              </div>
            </div>
            <button onClick={handleUpdate} disabled={loading} style={{
              width: "100%", padding: "12px", fontSize: 14, fontWeight: 700,
              background: C.acc, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer",
            }}>
              {loading ? "更新中..." : "パスワードを変更する"}
            </button>
            <button onClick={() => { setStep(1); setError(""); }} style={{
              width: "100%", padding: "10px", fontSize: 13, marginTop: 8,
              background: "transparent", color: C.muted, border: `1px solid ${C.line}`, borderRadius: 10, cursor: "pointer",
            }}>
              ← 戻る
            </button>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>変更が完了しました</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 24 }}>
              次回ログインから新しいパスワードが有効になります
            </div>
            <button onClick={() => { window.location.href = "/"; }} style={{
              width: "100%", padding: "12px", fontSize: 14, fontWeight: 700,
              background: C.acc, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer",
            }}>
              ログイン画面へ
            </button>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <a href="/" style={{ fontSize: 12, color: C.muted, textDecoration: "none" }}>← ログインへ戻る</a>
        </div>
      </div>
    </div>
  );
}
