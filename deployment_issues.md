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
