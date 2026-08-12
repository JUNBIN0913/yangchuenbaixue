# 陽春白雪KTV 線上點歌平台

三個獨立頁面 + 兩個共用檔案，全部連到同一個 Firebase 專案，資料即時同步。

```
firebase-config.js   ← 共用設定（Firebase 金鑰、QR碼連結網址）
ktv-utils.js          ← 共用工具（初始化 Firebase、網址辨識、分類常數）
index.html            ← 電視牆主控台（左：播放器／右：QR碼＋分類選歌）
order.html             ← 手機掃碼點歌頁
admin.html             ← 後台管理（加歌、歌曲庫、播放控制）
```

## 一、部署前設定（必做）

1. 到 [Firebase Console](https://console.firebase.google.com/) 新增一個專案
2. 「建置」→ Firestore Database → 建立資料庫
3. 「建置」→ Authentication → 登入方式 → 啟用「電子郵件/密碼」→ 到「使用者」分頁手動新增你自己的管理員帳號（例如你的 email + 一組密碼），這組帳密就是 `admin.html` 的登入帳密
4. 「專案設定」→ 一般 → 新增網頁應用程式，把產生的設定物件貼到 `firebase-config.js` 的 `FIREBASE_CONFIG`
5. 把 `order.html` 部署後的完整網址填入 `firebase-config.js` 的 `ORDER_PAGE_URL`（電視牆的 QR 碼會指向這個網址）
6. Firestore →「規則」，貼上 `firebase-config.js` 檔案開頭註解裡建議的安全性規則，發布

## 二、部署方式

三個 HTML 檔加上兩個共用 JS 檔，直接放同一層資料夾丟到任何靜態網站空間即可，例如：
- GitHub Pages（你「僻字考究網」用過的方式）
- Firebase Hosting（`firebase deploy`，跟 Firestore 同一個專案最省事）
- 任何支援靜態檔案的空間

電視牆用瀏覽器開 `index.html`（建議全螢幕 F11），後台自己用 `admin.html` 登入管理，客人掃 `index.html` 右上角的 QR 碼會連到 `order.html`。

## 三、資料結構（Firestore）

**songs 集合**（歌曲庫，後台維護）
| 欄位 | 說明 |
|---|---|
| title | 歌名 |
| artist | 歌手 |
| urlOriginal | 原唱版網址 |
| urlCover | 伴唱版網址（可為空字串） |
| language | 華語／方言／韓語／西洋 |
| singerType | 男歌手／女歌手／合唱／團體 |
| platform | youtube／bilibili／odysee（新增時自動判斷） |

**queue 集合**（目前播放佇列，`order` 由小到大排序，最小者＝正在播放）
| 欄位 | 說明 |
|---|---|
| title / artist / urlOriginal / urlCover | 從 songs 複製過來，方便顯示 |
| playingSource | "original" 或 "cover"，決定播放哪個版本 |
| order | 排序用的數字（新增用時間戳記，插歌用中間值） |
| requestedBy | 點歌來源（電視牆現場／手機掃碼／後台插歌） |

切歌＝刪除 `order` 最小的那筆 queue 文件；插歌＝在「播放中」與「原本下一首」之間插入一筆新的 `order` 值。

## 四、功能對照表

| 你的需求 | 實作位置 | 說明 |
|---|---|---|
| 後台即時加歌，貼網址即可 | admin.html | 自動辨識 YouTube／Bilibili／Odysee 並轉換為站內嵌入播放，不會跳轉外部 |
| 男/女/合唱/團體、華語/方言/韓語/西洋下拉選單 | admin.html | 新增歌曲表單內建下拉選單 |
| 顯示歌曲總數 | admin.html 頁首、index.html 右上角 | 即時反映 Firestore 歌曲數量 |
| 左邊隨機播放、右上QR、右邊分類選歌 | index.html | 佇列空時電視牆自動隨機播放歌曲庫；有人點播時自動切換 |
| 掃碼點歌平台，即時更新 | order.html | 與電視牆、後台共用同一份 Firestore 資料 |
| 切歌 | admin.html 播放控制面板 | 一鍵跳過目前播放 |
| 插歌 | admin.html 播放控制面板 | 搜尋歌曲，插入為「下一首」 |
| 原唱／伴唱切換 | admin.html 播放控制面板 | 切換目前播放中歌曲的音源（需該首歌有填伴唱版網址） |

## 五、已知技術限制（建置前務必知悉）

這些是 YouTube／Bilibili／Odysee **官方嵌入播放器本身的限制**，不是本專案沒做，而是第三方平台的嵌入 API 就是只開放這些權限：

- **速度與升降調**：依你的決定已從功能中移除，改用「原唱／伴唱雙版本網址切換」取代（你也已確認採用此方案）。
- **播放結束自動接歌**：YouTube 有官方 IFrame API 可以精準偵測「播放完畢」並自動跳下一首（已實作）。Bilibili／Odysee **沒有**對外部網站開放這種事件通知，所以：
  - 有人點播的 Bilibili／Odysee 歌曲播完後，需要你在 `admin.html` 手動按「切歌」（或未來歌曲庫都放 YouTube 版本就完全不用擔心）
  - 電視牆閒置的「隨機播放」模式下，若剛好隨機到 Bilibili／Odysee 的歌，程式用 4.5 分鐘計時器強制換下一首，作為沒有結束事件通知時的備援方案
- **Bilibili 地區限制**：Bilibili 官方對台灣／海外 IP 存取有時會有畫質限制或需要登入才能播放，這是該平台的政策，無法由本站繞過，建議歌曲庫優先收錄 YouTube／Odysee 版本，Bilibili 作為備用來源。

## 六、後續可以再擴充的方向（目前尚未實作）

- 點歌時記錄桌號／暱稱，方便現場叫號
- 後台批次匯入歌曲（CSV）
- 已點播歷史記錄／熱門點播排行榜
