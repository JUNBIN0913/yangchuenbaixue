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
 *     // 注意：queue 這裡改成完全公開讀寫（包含 delete），
 *     // 是因為手機掃碼點歌頁的「已點」分頁、「遙控」分頁的切歌功能，
 *     // 都需要讓「未登入的一般賓客」也能移除/跳過佇列裡的歌曲。
 *     // 這代表任何拿到這個網站網址的人，理論上都能直接呼叫 Firestore API 清空整個佇列，
 *     // 這是為了開放遠端遙控給所有賓客所做的取捨，你已確認接受這個風險。
 *     match /queue/{queueId} {
 *       allow read, write: if true;
 *     }
 *     // 遙控指令（音量、切歌）：手機「遙控」分頁寫入指令，電視牆讀取並執行，
 *     // 同樣是完全公開讀寫，任何人都能送出遙控指令。
 *     match /remoteControl/{docId} {
 *       allow read, write: if true;
 *     }
 *   }
 * }
 * ------------------------------------------------------------
 */

const FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// 點歌頁（order.html）的完整網址，用來產生首頁右上角的 QR Code。
// 部署後請改成你實際的網址，例如 GitHub Pages 網址。
const ORDER_PAGE_URL = "https://junbin0913.github.io/yangchuenbaixue/order.html";
