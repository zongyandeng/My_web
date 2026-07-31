# Deployment Issues (部署問題紀錄)

本檔案用於記錄在開發與部署此專案過程中遇到的部署失敗原因、根本原因及解決方案，以防止未來重複出錯。

---

## 1. 2026-07-05：Deploy to GitHub Pages 步驟失敗
* **失敗現象**：
  在 GitHub Actions 執行編譯與上傳 artifact 皆成功（`Install dependencies` & `Build` & `Upload artifact` 均為 success），但在最後一步 `Deploy to GitHub Pages` 執行失敗。
* **根本原因**：
  經排查，此為 GitHub Pages 雲端部署 API 的偶發性連線異常或權限暫時失效（API 返回伺服器端錯誤，非專案程式碼編譯問題）。
* **解決方案**：
  新增本紀錄檔案，並重新推送 (Push) 以觸發 Actions 重新執行部署流程。

## 2. 2026-07-06：Deploy to GitHub Pages 步驟再次失敗 (偶發)
* **失敗現象**：
  與 2026-07-05 同樣在 Actions 前期編譯成功，但在第 8 步 `Deploy to GitHub Pages` 出現 failure 阻斷。
* **根本原因**：
  確認為連續 Git Push 間隔過短（小於 60 秒），導致 GitHub Actions 的 `actions/deploy-pages` 雲端 API 出現併發衝突 (Concurrency Conflict, Status Code 409)，後續的部署任務因資源鎖定而失敗。
* **解決方案**：
  在 deployment_issues.md 中追加本次分析，並進行一次乾淨的 Git 推送。在推送後，AI 助理應嚴格等待其部署工作流徹底執行完畢，避免在 2 分鐘內重複推送引發衝突。

## 3. 2026-07-31：JSON 格式解析錯誤導致網頁無法載入資料
* **失敗現象**：
  大重構完成後，網頁側邊欄停留在 `Loading...`，主畫面出現 `載入筆記資料失敗，請檢查 JSON 檔案或使用伺服器環境運行。`。
* **根本原因**：
  在 JSON 欄位的細節 HTML 字串中，寫入了非法的轉義字元（如反引號 `\` 被轉義為 `\``，金錢符號 `$` 被轉義為 `\$`）。JSON.parse 在讀取到非規定的轉義字元時，會直接拋出 `SyntaxError: Bad escaped character`。
* **解決方案**：
  1. 撰寫暫時性 Node.js 本地腳本讀取並修正所有非法的 `\` 與 `$` 轉義。
  2. 修正後執行 `node -e` 命令驗證 JSON 能被成功載入，並執行 `npm run build` 通過。
  3. 推送更新到 GitHub Pages。
