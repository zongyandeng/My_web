# 專案部署與開發防錯守則 (Deployment & Development Rules)

後續所有參與此專案（My_web）開發的 AI 助理，在進行代碼修改、新增功能、設定調整或部署前，**必須嚴格遵循**以下防錯規範。

---

## 1. ESM 環境下 Node.js 變數防錯
本專案為 Vite 專案，且於 `package.json` 中配置了 `"type": "module"`（ES Modules 模式）。
- **嚴禁**在 `vite.config.js` 或任何打包/建置腳本中直接使用 CommonJS 的全域變數 `__dirname` 或 `__filename`。直接使用將導致 Node.js 執行期報錯 `__dirname is not defined`，造成本地與 CI/CD（GitHub Actions）編譯失敗。
- **正確做法**：必須使用以下 ESM 標準寫法來手動獲取：
  ```javascript
  import { resolve, dirname } from 'path';
  import { fileURLToPath } from 'url';

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  ```

## 2. 動態載入資源 (Fetch JSON / Dynamic Images) 處理
本專案（例如首頁、AI 實驗室、指令查詢等頁面）大量依賴 JS 動態載入的資料檔與圖片。
- **問題本質**：Vite 預設只會打包在程式碼中被**靜態 import** 的資源。對於在執行期使用 `fetch('src/data/xxx.json')` 載入的 JSON 檔案，或是利用 JS 動態拼接路徑載入的圖片，Vite 在編譯（build）時**不會**自動將其打包到 `dist` 中，進而導致部署後發生 404 崩潰。
- **防錯規則**：
  1. `vite.config.js` 中內建了 `copyStaticFiles()` 自訂插件。在每次新增動態讀取的資料夾或資源目錄時，**必須**確認該插件有將對應目錄複製到 `dist` 中。
  2. 目前已配置複製：`src/data` 到 `dist/src/data`；`src/img` 到 `dist/src/img`。若未來有新增其他類似的動態目錄，必須更新 `vite.config.js` 的 `copyStaticFiles` 內容。

## 3. 相對路徑與子路徑託管規範 (GitHub Pages Sub-folder)
專案預計部署至 GitHub Pages，其 URL 結構通常包含倉庫名稱子路徑（例如 `https://<username>.github.io/My_web/`）。
- **嚴禁**在 HTML 標籤（如 `<link>`, `<script>`, `<img>`, `<a>`）或 JS 代碼中使用以 `/` 開頭的絕對路徑（例如 `/src/style.css`、`/src/main.js`）。因為這會使瀏覽器嘗試從網域根目錄（例如 `github.io/src/...`）載入資源，導致 404 錯誤。
- **防錯規則**：
  1. 所有資源引用路徑必須使用**相對路徑**（例如 `src/style.css`、`./src/main.js` 或相對於當前 html 的相對路徑）。
  2. `vite.config.js` 中的 `base` 必須保持為 `'./'`，確保打包後的資源為相對路徑。

## 4. 部署源設定 (Deployment Source)
- 本專案採用 GitHub Actions 進行自動化部署工作流（配置於 `.github/workflows/deploy.yml`）。
- 當變更 Push 至 `main` 分支時，會自動在雲端進行編譯與部署。
- **注意**：必須確保 GitHub 倉庫（Settings > Pages）中將 **Build and deployment > Source** 設定為 **GitHub Actions**，否則自動化部署將無法運作。

---

## 5. 部署問題歷史紀錄維護 (Crucial)
- 專案根目錄下設有 [deployment_issues.md](file:///C:/Users/Edison/Desktop/antigravity/My_web/deployment_issues.md) 檔案。
- **任何時候**，如果在此專案的開發與部署過程中遇到了新的部署失敗原因，且經過排查解決後，**必須**將該次失敗原因、根本原因及解決方案記錄至 `deployment_issues.md` 檔案的末尾，並視情況更新本 `AGENTS.md` 防錯規則，以防未來重複出錯！

---

## 6. Git Push 後的部署檢查排程規範 (GitHub Deployment Verification Schedule)
- **要求**：在每次成功執行 `git push` 到 GitHub 後，AI 助理**必須**主動使用系統提供的 `schedule`（排程/計時器）工具建立一個一次性的檢查提醒任務（One-shot timer，建議設為 120 秒之後，因為 GitHub Actions 編譯部署通常需要 1~2 分鐘）。
- **計時器 Prompt**：排程的 Prompt 應設為：「檢查 GitHub Pages 部署狀態與 Actions 執行結果」。
- **檢查機制**：當排程計時器觸發（或是在推送後等待期間），AI 助理應透過 git 或 GitHub 網頁確認部署狀態，以保證部署沒有失敗。

---

## 7. 電腦更換與 C 槽專屬部署備忘 (C-Drive Only Environment)
- **環境現況**：本專案已自舊電腦的 D 槽遷移至新電腦的 **C 槽桌面**，路徑為 `C:\Users\Edison\Desktop\antigravity\My_web`。
- **執行規則**：由於本台電腦僅有 C 槽，後續助理在閱讀或執行任何來自全域規範中「優先使用 D 槽儲存」的規則時，**一律忽略並直接在 C 槽專案目錄下進行所有新增、編輯與執行操作**。
- **Git 與工具鏈**：當前新電腦之環境變數與 Git 推送工具皆基於 C 槽桌面目錄運行，請確保於此目錄下執行所有 git 同步指令。
