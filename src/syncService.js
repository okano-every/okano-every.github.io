/**
 * syncService.js — GitHub Gist を使ったデバイス間データ同期
 *
 * 対象キー:
 *   okano-manual-cash-v1     (手入力現金)
 *   okano-bank-exclusions-v1 (銀行アーカイブ設定)
 *   okano-ins-exclusions-v1  (保険アーカイブ設定)
 *   okano-savings-plan-v1    (積立設定)
 *
 * 同期ルール: タイムスタンプが新しい方を採用
 * Gist には単一ファイル "okano_sync.json" として保存
 */

const SYNC_KEYS = [
  "okano-manual-cash-v1",
  "okano-bank-exclusions-v1",
  "okano-ins-exclusions-v1",
  "okano-savings-plan-v1",
];

const GIST_FILE_NAME = "okano_sync.json";
const GIST_ID_KEY    = "okano-gist-id";
const GIST_PAT_KEY   = "okano-gist-pat-session"; // TODO: Key name kept for compatibility, but now uses localStorage

// ─────────────────────────────────────────
// PAT の保存・取得（localStorage）
// ─────────────────────────────────────────
export function savePat(pat) {
  localStorage.setItem(GIST_PAT_KEY, pat);
}
export function loadPat() {
  return localStorage.getItem(GIST_PAT_KEY) || "";
}
export function clearPat() {
  localStorage.removeItem(GIST_PAT_KEY);
}

export function saveGistId(id) {
  localStorage.setItem(GIST_ID_KEY, id);
}
export function loadGistId() {
  return localStorage.getItem(GIST_ID_KEY) || "";
}

// ─────────────────────────────────────────
// ローカルスナップショット作成
// ─────────────────────────────────────────
function buildLocalSnapshot() {
  const tsStr = localStorage.getItem("okano-sync-ts");
  const payload = { _ts: tsStr ? Number(tsStr) : 0 };
  SYNC_KEYS.forEach((k) => {
    try {
      const raw = localStorage.getItem(k);
      payload[k] = raw ? JSON.parse(raw) : null;
    } catch {
      payload[k] = null;
    }
  });
  return payload;
}

// ─────────────────────────────────────────
// ローカルへの書き戻し
// ─────────────────────────────────────────
function applySnapshot(snap) {
  SYNC_KEYS.forEach((k) => {
    if (snap[k] !== undefined && snap[k] !== null) {
      try {
        localStorage.setItem(k, JSON.stringify(snap[k]));
      } catch (e) {
        console.error("[sync] localStorage write failed:", k, e);
      }
    }
  });
}

// ─────────────────────────────────────────
// Gist 取得
// ─────────────────────────────────────────
async function fetchGistContent(gistId, pat) {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers: {
      Authorization: `token ${pat}`,
      Accept: "application/vnd.github.v3+json",
    },
  });
  if (!res.ok) throw new Error(`Gist fetch failed: ${res.status}`);
  const data = await res.json();
  const raw = data.files?.[GIST_FILE_NAME]?.content;
  if (!raw) return null;
  return JSON.parse(raw);
}

// ─────────────────────────────────────────
// Gist 保存（新規作成 or 更新）
// ─────────────────────────────────────────
async function saveToGist(pat, gistId, snapshot) {
  const body = {
    description: "岡野ファミリー 資産管理App 同期データ",
    public: false,
    files: {
      [GIST_FILE_NAME]: { content: JSON.stringify(snapshot, null, 2) },
    },
  };

  let url, method;
  if (gistId) {
    url    = `https://api.github.com/gists/${gistId}`;
    method = "PATCH";
  } else {
    url    = "https://api.github.com/gists";
    method = "POST";
  }

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `token ${pat}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Gist save failed: ${res.status}`);
  const data = await res.json();
  return data.id; // 新規作成時は ID が返る
}

// ─────────────────────────────────────────
// メイン同期関数
// 戻り値: { status: 'ok'|'error'|'no_pat', message, direction: 'upload'|'download'|'same' }
// ─────────────────────────────────────────
export async function syncData() {
  const pat    = loadPat();
  const gistId = loadGistId();

  if (!pat) return { status: "no_pat", message: "GitHub PAT が未設定です" };

  try {
    const local = buildLocalSnapshot();
    let remote  = null;

    if (gistId) {
      try {
        remote = await fetchGistContent(gistId, pat);
      } catch (e) {
        console.warn("[sync] Gist fetch failed, will create new:", e.message);
      }
    }

    let direction = "same";
    let finalSnap = local;

    if (!remote) {
      // Gist が存在しない or 取得失敗 → ローカルをアップロード
      direction = "upload";
    } else if (remote._ts > local._ts) {
      // リモートが新しい → ダウンロードして適用
      direction = "download";
      finalSnap = remote;
      applySnapshot(remote);
    } else if (local._ts > remote._ts) {
      // ローカルが新しい → アップロード
      direction = "upload";
    }
    // 同タイムスタンプの場合は何もしない（direction = "same"）

    // アップロード（新規作成 or 更新）
    if (direction !== "same") {
      const newId = await saveToGist(pat, gistId, finalSnap);
      if (newId && newId !== gistId) {
        saveGistId(newId);
      }
    }

    return {
      status: "ok",
      message: direction === "download"
        ? "リモートから最新データを取得しました"
        : direction === "upload"
        ? "ローカルデータをリモートに保存しました"
        : "データは最新です",
      direction,
    };
  } catch (e) {
    console.error("[sync] error:", e);
    return { status: "error", message: e.message };
  }
}

// ─────────────────────────────────────────
// ローカルタイムスタンプを今に更新（データ変更時に呼ぶ）
// ─────────────────────────────────────────
export function touchLocalTs() {
  // syncData が buildLocalSnapshot() で常に最新を作るので
  // 特別な処理は不要。ただし明示的な更新フラグが必要な場合は
  // localStorage に _ts キーを書き込む。
  localStorage.setItem("okano-sync-ts", String(Date.now()));
}
