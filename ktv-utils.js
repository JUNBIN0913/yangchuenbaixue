/**
 * 共用工具：初始化 Firebase、影片網址辨識、分類常數
 * 三個頁面都會載入 firebase-config.js → ktv-utils.js
 */

// ---------- Firebase 初始化（compat 版，方便單檔案 <script> 直接用） ----------
firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();
const auth = firebase.auth();

// ---------- 分類常數 ----------
const LANGUAGE_CATS = ["華語", "方言", "韓語", "日語", "西洋", "其他"];
const SINGER_TYPES = ["男歌手", "女歌手", "合唱", "團體"];

// ---------- 影片網址辨識 ----------
/**
 * 傳入使用者貼上的 YouTube / Bilibili / Odysee 網址，
 * 回傳 { platform, embedUrl, ok }。
 * platform: 'youtube' | 'bilibili' | 'odysee' | null（無法辨識）
 */
function parseVideoUrl(rawUrl) {
  if (!rawUrl) return { platform: null, embedUrl: "", ok: false };
  const url = rawUrl.trim();

  // YouTube：watch?v=, youtu.be/, shorts/, embed/
  const ytMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (ytMatch) {
    const id = ytMatch[1];
    return {
      platform: "youtube",
      videoId: id,
      embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&enablejsapi=1&playsinline=1&rel=0`,
      ok: true
    };
  }

  // Bilibili：BV 號
  const biliMatch = url.match(/BV[a-zA-Z0-9]+/);
  if (biliMatch && url.includes("bilibili.com")) {
    const bvid = biliMatch[0];
    return {
      platform: "bilibili",
      videoId: bvid,
      embedUrl: `https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=1&high_quality=1&danmaku=0`,
      ok: true
    };
  }

  // Odysee：把網址路徑轉成官方 embed 格式
  if (url.includes("odysee.com")) {
    try {
      const u = new URL(url);
      let path = u.pathname; // e.g. /@channel:c/video-title:v
      if (path.startsWith("/$/embed/")) {
        return { platform: "odysee", videoId: path, embedUrl: url, ok: true };
      }
      const embedUrl = `https://odysee.com/$/embed${path}?autoplay=1`;
      return { platform: "odysee", videoId: path, embedUrl, ok: true };
    } catch (e) {
      return { platform: null, embedUrl: "", ok: false };
    }
  }

  return { platform: null, embedUrl: "", ok: false };
}

// ---------- 小工具 ----------
function escapeHtml(str) {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}


// ---------- Firestore 錯誤訊息（讓「權限不足」這類問題能直接看到，而不是默默沒反應） ----------
function describeFirestoreError(err){
  if (!err) return "未知錯誤";
  if (err.code === "permission-denied") return "權限不足（請到 Firebase 更新並發布 Firestore 規則）";
  return err.code || err.message || "未知錯誤";
}

// ---------- 點播佇列：避免重複加入同一首歌 ----------
function isSongInQueue(song, queueList){
  return (queueList || []).some(q => q.songId === song.id);
}

/**
 * 以交易（transaction）方式加入佇列：文件 ID 固定為 "s_" + 歌曲ID，
 * 所以就算兩支手機在同一瞬間點同一首歌，也只會有一個成功。
 * 回傳 { ok:true } / { ok:false, duplicate:true } / { ok:false, error }
 */
async function addSongToQueueUnique(song, requestedBy, orderValue){
  const ref = db.collection("queue").doc("s_" + song.id);
  try{
    await db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (snap.exists) throw new Error("DUPLICATE");
      tx.set(ref, {
        songId: song.id,
        title: song.title,
        artist: song.artist || "",
        urlOriginal: song.urlOriginal || "",
        urlCover: song.urlCover || "",
        playingSource: "original",
        order: orderValue,
        addedAt: firebase.firestore.FieldValue.serverTimestamp(),
        requestedBy: requestedBy
      });
    });
    return { ok: true };
  }catch(e){
    if (e && e.message === "DUPLICATE") return { ok:false, duplicate:true };
    return { ok:false, error:e };
  }
}

// ---------- 歌手名稱排序：依筆劃少到多（逐字比較），非中文字（英文等）排在中文後面並依字母排序 ----------
function compareNamesByStrokes(a, b){
  a = (a || ""); b = (b || "");
  const strokes = (typeof getStrokeCount === "function") ? getStrokeCount : () => 999;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++){
    const ca = a.charAt(i), cb = b.charAt(i);
    const sa = strokes(ca), sb = strokes(cb);
    if (sa !== sb) return sa - sb;
    if (sa === 999){
      const la = ca.toLowerCase(), lb = cb.toLowerCase();
      if (la !== lb) return la < lb ? -1 : 1;
    }
  }
  if (a.length !== b.length) return a.length - b.length;
  return a.localeCompare(b, "zh-Hant");
}
