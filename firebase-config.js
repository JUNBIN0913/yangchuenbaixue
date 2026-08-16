/**
 * 共用 Firebase 設定檔
 * ------------------------------------------------------------
 * 三個頁面（index.html / order.html / admin.html）都會載入這個檔案，
 * 確保三邊連到同一個 Firestore 專案、資料即時同步。
 *
 * 使用方式：
 * 1. 到 https://console.firebase.google.com/ 建立一個新專案
 * 2. 專案設定 → 新增網頁應用程式 → 複製底下的設定物件貼到這裡
 * 3. 到 Firestore Database → 建立資料庫（正式模式即可，安全性規則見下方）
 * 4. 到 Authentication → 登入方式 → 啟用「電子郵件/密碼」
 *    然後在「使用者」分頁手動新增一組你要用的後台管理員帳號密碼
 *
 * 建議的 Firestore 安全性規則（Firestore Database → 規則）：
 * ------------------------------------------------------------
 * rules_version = '2';
 * service cloud.firestore {
 *   match /databases/{database}/documents {
 *     // 歌曲庫、播放佇列：任何人都可以讀取（電視牆、點歌手機頁需要）
 *     match /songs/{songId} {
 *       allow read: if true;
 *       allow write: if request.auth != null; // 只有登入的後台可以新增/編輯/刪除歌曲
 *     }
 *     match /queue/{queueId} {
 *       allow read: if true;
 *       allow create: if true;                // 賓客掃碼點歌可以新增到佇列
 *       allow update, delete: if request.auth != null; // 切歌/插歌/原唱伴唱切換僅後台可操作
 *     }
 *   }
 * }
 * ------------------------------------------------------------
 */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyAddet--nHh0wLCLt__kY89ImZ_2bnEDd4",
  authDomain: "yangchuenbaixue.firebaseapp.com",
  projectId: "yangchuenbaixue",
  storageBucket: "yangchuenbaixue.firebasestorage.app",
  messagingSenderId: "729817001481",
  appId: "1:729817001481:web:b443d68c6758b5a67292d8",
  measurementId: "G-82GFVJ3M81"
};

// 點歌頁（order.html）的完整網址，用來產生首頁右上角的 QR Code。
// 部署後請改成你實際的網址，例如 GitHub Pages 網址。
const ORDER_PAGE_URL = "https://junbin0913.github.io/yangchuenbaixue/order.html";
