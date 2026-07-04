# 🌌 Edison.Dev | 個人經歷與 AI 學習實驗室

歡迎來到 **Edison.Dev**！這是一個專為展示個人經歷、AI 學術研究成果與開發指令查詢而打造的前衛個人網站。

本專案採用 **Vite** 構建，搭配 **Vanilla CSS** 與 **原生 JavaScript**，融合了極具未來感的流光背景、豐富的 Canvas 互動特效，並支援深空主題（Deep Space）切換。

---

## 🚀 線上預覽

- **網站網址**：[Edison.Dev (GitHub Pages)](https://zongyandeng.github.io/My_web/) *(請將連結替換為您的實際部署網址)*

---

## 🎨 專案特色

1. **極致視覺與互動體驗**
   - **動態流光背景**：採用現代 CSS 漸變與網格覆蓋，營造宇宙深空氛圍。
   - **特效控制台**：提供多種滑鼠互動特效切換（無特效、聚光燈、科技連線、流星拖尾、磁吸游標），由 Canvas 與動態游標實時繪製。
   - **主題切換**：內建自訂深空（Deep Space）配色主題。

2. **自適應響應式設計 (RWD)**
   - 完美適配桌上型電腦、平板與手機等不同尺寸的螢幕。
   - 具備專屬的手機捷徑與 App 封面圖示 (`app_icon.png`)。

3. **SEO 最佳化**
   - 遵循語意化 HTML 結構，配置合適的 Meta 描述與標題，確保搜尋引擎友善度。

---

## 📂 功能單元介紹

本網站由以下五個核心頁面構成：

*   **🌌 首頁 (`index.html`)**：網站入口，包含 Hero 區塊、3D 互動選單卡片，以及「特效控制台」面板。
*   **🏅 個人經歷 (`profile.html`)**：展示 Edison 的個人學術背景、競賽獲獎經歷與職涯時間軸。
*   **🧠 AI 學習實驗室 (`ai-learning.html`)**：詳細記錄 RAG（檢索增強生成）原理、混淆矩陣分析、Loss 指標折線圖等 AI 教學，具備頁面滾動重設功能。
*   **💻 硬體研究室 (`hardware.html`)**：探討 GPU 顯示卡選購、顯存位寬、SSD 讀寫壽命等 AI 開發硬體科普。
*   **🐧 開發指令查詢 (`commands.html`)**：互動式仿真終端機介面，支援實時關鍵字搜尋與分類過濾，可快速查詢 **Ubuntu SSH、Docker、Git、PyTorch、WSL Ubuntu** 等常用指令。

---

## 🛠️ 技術棧

- **構建工具**：[Vite 8](https://vitejs.dev/)
- **邏輯控制**：Vanilla JavaScript (ES Modules)
- **視覺樣式**：Vanilla CSS
- **畫布特效**：HTML5 Canvas 粒子與物理動畫

---

## 📦 本機開發指南

### 1. 複製專案
```bash
git clone https://github.com/zongyandeng/My_web.git
cd My_web
```

### 2. 安裝相依套件
本專案僅使用 Vite 做為開發與打包工具：
```bash
npm install
```

### 3. 啟動本機開發伺服器
啟動後可在瀏覽器開啟 `http://localhost:5173` 進行即時預覽與調試：
```bash
npm run dev
```

### 4. 專案編譯打包
將專案編譯並輸出到 `dist` 資料夾：
```bash
npm run build
```

---

## 🚢 部署與防錯規範

本專案採用 **GitHub Actions** 進行自動化編譯與部署（工作流定義於 `.github/workflows/deploy.yml`）。在修改專案時，請嚴格遵守以下防錯守則（詳見 [AGENTS.md](.agents/AGENTS.md)）：

1. **ESM 環境 Node 變數防錯**
   - 專案為 ES Modules 模式（`"type": "module"`）。在 `vite.config.js` 中**嚴禁直接使用** `__dirname`，必須透過 `fileURLToPath` 手動獲取。
2. **動態資源打包**
   - 網站中的 JSON 資料檔與部分圖片是透過 JS 在執行期動態載入的。Vite 預設不會打包這些檔案。
   - 專案已在 `vite.config.js` 配置 `copyStaticFiles()` 插件，會自動將 `src/data` 與 `src/img` 複製到 `dist` 中。新增動態資料目錄時需同步更新配置。
3. **相對路徑引用**
   - 部署至 GitHub Pages 時有倉庫子路徑。**嚴禁使用以 `/` 開頭的絕對路徑**，所有 HTML 與 JS 資源引用必須使用相對路徑。`vite.config.js` 中的 `base` 已設定為 `'./'`。

若在部署過程中遇到任何新問題，請查閱並更新 [deployment_issues.md](deployment_issues.md) 紀錄。

---

## 📂 專案目錄結構

```text
My_web/
├── .agents/              # AI 代理開發規範目錄
│   └── AGENTS.md         # 部署與開發防錯守則
├── .github/
│   └── workflows/
│       └── deploy.yml    # GitHub Actions 自動部署腳本
├── public/               # 靜態資源目錄
│   └── app_icon.png      # 網站圖示
├── src/
│   ├── data/             # 動態載入的 JSON 資料檔（指令、學習筆記等）
│   ├── img/              # 動態載入的圖片與插圖
│   ├── style.css         # 全域樣式與主題設計系統
│   ├── main.js           # 全域邏輯與導覽列控制
│   ├── renderer.js       # 首頁 Canvas 特效渲染
│   └── effects.js        # 互動特效與控制面板邏輯
├── index.html            # 首頁
├── profile.html          # 個人經歷頁
├── ai-learning.html      # AI 實驗室頁
├── hardware.html         # 硬體研究室頁
├── commands.html         # 指令查詢頁
├── vite.config.js        # Vite 設定檔 (含資源複製插件)
├── package.json          # 專案相依性與指令
└── deployment_issues.md  # 部署歷史問題紀錄簿
```
