# 專案部署踩坑與防錯歷史紀錄 (Deployment Issues & Solutions Log)

本檔案詳細記錄了本專案（My-Web 個人網站）在部署至 GitHub Pages 或其他託管平台時，所遭遇的技術錯誤、發生原因及最終解決方案。

> [!IMPORTANT]
> **維護規範**：本檔案為專案的防錯知識庫。**未來不論是開發者或任何 AI 助理，若在此專案遇到新的部署失敗原因且順利解決後，皆必須在本文檔末尾追加記錄**，並同步更新 `.agents/AGENTS.md` 防錯守則，以確保整個開發團隊（與 AI）不會重複出錯。

---

## 歷史錯誤紀錄

### 踩坑事件 #1：CommonJS 變數 `__dirname` 於 ESM 專案中未定義而導致建置崩潰
* **發生時間**：2026-07-04
* **錯誤徵兆**：GitHub Actions 的 CI 工作流（或本地 `npm run build`）執行時報錯：`ReferenceError: __dirname is not defined` 並導致打包中斷、部署失敗。
* **錯誤原因**：
  在 `package.json` 中配置了 `"type": "module"` 後，專案全面啟用 ES Modules 模式。此時，Node.js 預設不提供 `__dirname` 和 `__filename` 這兩個 CommonJS 的全域變數，但在 `vite.config.js` 中卻直接使用了它們來解析檔案路徑。
* **解決方案**：
  在 `vite.config.js` 中，透過引進 `path` 與 `url` 模組，改用以下符合 ESM 標準的程式碼來獲取 `__dirname`：
  ```javascript
  import { resolve, dirname } from 'path';
  import { fileURLToPath } from 'url';

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  ```

---

### 踩坑事件 #2：動態載入的 JSON 與圖片資源在打包後遺失（404 錯誤）
* **發生時間**：2026-07-04
* **錯誤徵兆**：部署上線後，網頁的「AI 實驗室」與「指令查詢」等功能無法載入內容，一直顯示 Loading，瀏覽器控制台（Console）出現多個針對 `src/data/ai-notes.json`、`src/data/commands-notes.json` 及相關圖片的 `404 Not Found` 錯誤。
* **錯誤原因**：
  Vite 在預設編譯打包（Vite build）時，只會追蹤並打包那些在代碼中被**靜態 `import`** 進來的資源。而本專案的資料是透過前端 JS（如 `renderer.js`）在執行期使用 `fetch()` 動態請求的 JSON 檔案，以及動態拼接路徑的圖片（如 YOLO 混淆矩陣圖片等），這些動態資源不會被 Vite 自動分析。因此，它們不會被放入編譯輸出目錄（`dist`），導致線上環境找不到檔案。
* **解決方案**：
  在 `vite.config.js` 中實作一個自訂的靜態資源複製插件 `copyStaticFiles`。在編譯打包完成後（使用 `closeBundle` 鉤子），手動將 `src/data` 和 `src/img` 資料夾複製到 `dist/src/data` 與 `dist/src/img` 下，以保證部署後的目錄結構與本地開發時完全一致。
  ```javascript
  function copyStaticFiles() {
    return {
      name: 'copy-static-files',
      closeBundle() {
        fs.mkdirSync(resolve(__dirname, 'dist/src/data'), { recursive: true });
        fs.mkdirSync(resolve(__dirname, 'dist/src/img'), { recursive: true });
        fs.cpSync(resolve(__dirname, 'src/data'), resolve(__dirname, 'dist/src/data'), { recursive: true });
        fs.cpSync(resolve(__dirname, 'src/img'), resolve(__dirname, 'dist/src/img'), { recursive: true });
        console.log('Successfully copied src/data and src/img to dist/src/');
      }
    };
  }
  ```

---

### 踩坑事件 #3：以 `/` 開頭的絕對路徑導致 GitHub Pages 子目錄託管 404
* **發生時間**：2026-07-04 以前
* **錯誤徵兆**：專案部署到 GitHub Pages 後網頁一片空白，CSS 樣式與 JS 邏輯完全沒有載入，控制台顯示載入資源失敗。
* **錯誤原因**：
  GitHub Pages 通常是將網站託管於子路徑下（例如 `https://zongyandeng.github.io/My_web/`）。若在 HTML 或代碼中使用絕對路徑（如 `/src/style.css`），瀏覽器會試圖去最頂層的網域根目錄（`https://zongyandeng.github.io/src/style.css`）尋找該檔案，這會直接跳過 `/My_web/` 這個子目錄，從而發生 404 資源找不到。
* **解決方案**：
  1. 將 HTML 與 JS 代碼中所有資源路徑（樣式表、腳本、圖片、超連結等）全部改為**相對路徑**（即去掉開頭的 `/`，例如改為 `src/style.css` 或 `./src/main.js`）。
  2. 在 `vite.config.js` 中配置 `base: './'`，確保 Vite 打包後的資源引入路徑自動使用相對路徑，以支援子目錄託管。

---

### 踩坑事件 #4：GitHub Pages 部署來源設定與 Actions 工作流未同步
* **發生時間**：2026-07-04
* **錯誤徵兆**：專案推送（Push）到 GitHub 倉庫後，GitHub Pages 的網站內容卻沒有任何更新，或是 Actions 編譯成功了，但網頁沒有套用最新的靜態檔案。
* **錯誤原因**：
  雖然程式碼庫中已經建立了自動化部署設定 `.github/workflows/deploy.yml`，但 GitHub 倉庫設定（Settings > Pages）中，其 **Build and deployment > Source** 仍被設為預設的 **Deploy from a branch**（指向 `main` 根目錄或 `gh-pages` 分支），導致 GitHub Pages 沒有正確讀取並發布 GitHub Actions 每次編譯完成後所上傳的產物。
* **解決方案**：
  必須手動至該 GitHub 儲存庫的設定頁面進行調整：
  1. 進入該 GitHub Repository 頁面。
  2. 點擊 **Settings** 標籤頁。
  3. 在左側導覽列點選 **Pages**。
  4. 在 **Build and deployment > Source** 的下拉式選單中，將原本的 **Deploy from a branch** 切換成 **GitHub Actions**。
