/**
 * 共用工具：初始化 Firebase、影片網址辨識、分類常數
 * 三個頁面都會載入 firebase-config.js → ktv-utils.js
 */

// ---------- Firebase 初始化（compat 版，方便單檔案 <script> 直接用） ----------
firebase.initializeApp(FIREBASE_CONFIG);
const db = firebase.firestore();
const auth = firebase.auth();

// ---------- 分類常數 ----------
const LANGUAGE_CATS = ["華語", "方言", "韓語", "西洋", "日語"];
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
