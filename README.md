# 陽春白雪KTV 線上點歌平台

三個獨立頁面 + 兩個共用檔案，全部連到同一個 Firebase 專案，資料即時同步。

```
firebase-config.js   ← 共用設定（Firebase 金鑰、QR碼連結網址）
ktv-utils.js          ← 共用工具（初始化 Firebase、網址辨識、分類常數）
qrcode-lib.js          ← QR 碼產生函式庫（純前端運算，不依賴任何外部圖片服務）
stroke-data.js         ← 漢字筆劃數對照表（用於歌曲排序）
index.html            ← 電視牆主控台（左：播放器／右：QR碼＋分類選歌）
order.html             ← 手機掃碼點歌頁（點歌／已點／遙控 三分頁）
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
| language | 華語／方言／韓語／西洋／日語 |
| singerType | 男歌手／女歌手／合唱／團體 |
| platform | youtube／bilibili／odysee（新增時自動判斷） |
| isNewSong | 布林值，是否為「本月新歌」（選填標籤，不影響原本的語言分類） |

**queue 集合**（目前播放佇列，`order` 由小到大排序，最小者＝正在播放）
| 欄位 | 說明 |
|---|---|
| title / artist / urlOriginal / urlCover | 從 songs 複製過來，方便顯示 |
| playingSource | "original" 或 "cover"，決定播放哪個版本 |
| order | 排序用的數字（新增用時間戳記，插歌用中間值） |
| requestedBy | 點歌來源（電視牆現場／手機掃碼／後台插歌） |

切歌＝刪除 `order` 最小的那筆 queue 文件；插歌＝在「播放中」與「原本下一首」之間插入一筆新的 `order` 值。

**remoteControl 集合**（手機遙控用，只有一筆文件 `cmd`）
| 欄位 | 說明 |
|---|---|
| action | "skip"／"volumeUp"／"volumeDown" |
| ts | serverTimestamp，電視牆用來判斷是不是「新」指令，避免重新整理時重放舊指令 |

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
| 閒置自動放大播放器 | index.html | 60 秒沒有本機操作，右側面板自動收合、播放器變寬；有本機操作或按「點歌」鍵立刻恢復。手機/後台遠端點歌不會觸發或打斷這個效果 |
| 本月新歌宮格 | index.html／order.html／admin.html | 語言分類前多一張跨分類標籤卡片，後台新增歌曲時勾選即可 |
| 手機遙控（音量、切歌） | order.html「遙控」分頁 | 透過 Firestore 的 `remoteControl` 集合傳指令給電視牆執行；音量僅對 YouTube 有效 |
| 已點歌曲可移除 | index.html／order.html 的「已點」分頁 | 點擊「移除」即可從佇列刪除，不影響歌曲庫本身 |
| 歌曲排序 | index.html／order.html | 同分類下先按歌名字數少至多排序，字數相同再按第一個字筆劃數少至多排序（資料來源見 `stroke-data.js`） |

## 五、遠端遙控的權限取捨（請注意）

「遙控」分頁（切歌、調音量）目前是**開放給所有掃碼進來的賓客**，這是你明確確認要的設定。這代表：

- 任何拿到 `order.html` 網址或掃到 QR 碼的人，都可以切掉別人正在唱的歌、調整音量
- Firestore 安全性規則也因此把 `queue` 集合的刪除權限、以及新的 `remoteControl` 集合完全開放給未登入的訪客（詳見 `firebase-config.js` 開頭的規則註解）
- 如果之後發現被亂用（例如客人互相惡搞切歌），比較實際的做法是把「遙控」分頁改成只有你告訴特定客人／服務生的網址才看得到，或加一組簡單的識別碼機制——這部分目前沒有做，需要的話再跟我說

## 六、已知技術限制（建置前務必知悉）

這些是 YouTube／Bilibili／Odysee **官方嵌入播放器本身的限制**，不是本專案沒做，而是第三方平台的嵌入 API 就是只開放這些權限：

- **速度與升降調**：依你的決定已從功能中移除，改用「原唱／伴唱雙版本網址切換」取代（你也已確認採用此方案）。
- **播放結束自動接歌**：YouTube 有官方 IFrame API 可以精準偵測「播放完畢」並自動跳下一首（已實作）。Bilibili／Odysee **沒有**對外部網站開放這種事件通知，所以：
  - 有人點播的 Bilibili／Odysee 歌曲播完後，需要你在 `admin.html` 手動按「切歌」（或未來歌曲庫都放 YouTube 版本就完全不用擔心）
  - 電視牆閒置的「隨機播放」模式下，若剛好隨機到 Bilibili／Odysee 的歌，程式用 4.5 分鐘計時器強制換下一首，作為沒有結束事件通知時的備援方案
- **Bilibili 地區限制**：Bilibili 官方對台灣／海外 IP 存取有時會有畫質限制或需要登入才能播放，這是該平台的政策，無法由本站繞過，建議歌曲庫優先收錄 YouTube／Odysee 版本，Bilibili 作為備用來源。
- **【實測確認】Bilibili 嵌入常會跳轉出站**：實際部署後發現，多首 Bilibili 歌曲點擊後會直接跳轉到 bilibili.com，而不是留在站內播放。原因是 Bilibili 會檢查嵌入請求的來源網域，不在其白名單內的網站，播放器會顯示「請到 B 站觀看」的導引頁，點下去就整個跳出去——這是 Bilibili 平台端的策略，程式碼層級無法繞過。**實務上建議歌曲庫盡量優先收錄 YouTube 版本**，Bilibili 僅作為 YouTube 沒有的冷門歌曲備用來源，且要有心理準備該筆點播可能會直接跳轉出站。
- **【實測確認】Bilibili／Odysee 會靜音自動播放，YouTube 不會**：這是瀏覽器（Chrome/Edge）的自動播放安全政策決定的，並非本站程式碼設定。瀏覽器會依「網域信任度」決定新影片能不能帶聲音自動播放，YouTube 幾乎在所有瀏覽器都已被判定為高信任網域，Bilibili／Odysee 則沒有，會被強制先靜音，需要使用者手動點擊播放器上的喇叭圖示才能有聲音。無法透過本站程式碼或 Bilibili／Odysee 提供的嵌入參數強制解除，這是瀏覽器刻意設計的限制。

## 七、後續可以再擴充的方向（目前尚未實作）

- 點歌時記錄桌號／暱稱，方便現場叫號
- 後台批次匯入歌曲（CSV）
- 已點播歷史記錄／熱門點播排行榜
