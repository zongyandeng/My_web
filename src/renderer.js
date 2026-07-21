// --- 全域主題管理 (Global Theme Switcher) ---
function initTheme() {
  const savedTheme = localStorage.getItem('theme') || 'deepspace';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeToggleBtn(savedTheme);

  // 監聽按鈕點擊
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'deepspace' ? 'cyberpunk' : 'deepspace';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeToggleBtn(newTheme);
    });
  }
}

function updateThemeToggleBtn(theme) {
  const toggleBtn = document.getElementById('theme-toggle');
  if (toggleBtn) {
    if (theme === 'cyberpunk') {
      toggleBtn.innerHTML = '⚡ Cyberpunk';
      toggleBtn.style.borderColor = 'var(--accent-2)';
    } else {
      toggleBtn.innerHTML = '🌌 Deep Space';
      toggleBtn.style.borderColor = 'var(--accent-1)';
    }
  }
}

// 初始化主題
document.addEventListener('DOMContentLoaded', initTheme);

// --- 渲染器核心輔助方法 (Helper Methods) ---

// 渲染 LaTeX 數學公式
function triggerKaTeX(elementId) {
  const container = document.getElementById(elementId);
  if (!container) return;
  if (window.renderMathInElement) {
    window.renderMathInElement(container, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true }
      ],
      throwOnError: false
    });
  }
}

// 渲染 Prism.js 程式碼高亮
function triggerPrism() {
  if (window.Prism) {
    window.Prism.highlightAll();
  }
}

// 啟用側邊欄拖曳排序
function enableSidebarDragAndDrop(sidebar, storageKey, data) {
  let draggingItem = null;

  const items = sidebar.querySelectorAll('.sidebar-item');
  items.forEach(item => {
    item.addEventListener('dragstart', (e) => {
      draggingItem = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      draggingItem = null;

      // 拖曳結束後，讀取所有子項目的新順序並儲存
      const newOrder = [...sidebar.querySelectorAll('.sidebar-item')].map(li => li.getAttribute('data-id'));
      localStorage.setItem(storageKey, JSON.stringify(newOrder));

      // 同步更新記憶體中 data 的順序
      data.sort((a, b) => newOrder.indexOf(a.id) - newOrder.indexOf(b.id));
    });
  });

  sidebar.addEventListener('dragover', (e) => {
    e.preventDefault();
    const afterElement = getDragAfterElement(sidebar, e.clientY);
    if (draggingItem) {
      if (afterElement == null) {
        sidebar.appendChild(draggingItem);
      } else {
        sidebar.insertBefore(draggingItem, afterElement);
      }
    }
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.sidebar-item:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// --- 1. AI 學習實驗室渲染邏輯 ---
export async function loadAndRenderAINotes() {
  const sidebar = document.getElementById('ai-sidebar-menu');
  const contentContainer = document.getElementById('ai-note-content');
  if (!sidebar || !contentContainer) return;

  try {
    const response = await fetch('src/data/ai-notes.json');
    let data = await response.json();

    // 依照 localStorage 保存的順序排序
    const savedOrder = localStorage.getItem('ai-notes-order');
    if (savedOrder) {
      const orderArray = JSON.parse(savedOrder);
      data.sort((a, b) => {
        const idxA = orderArray.indexOf(a.id);
        const idxB = orderArray.indexOf(b.id);
        const orderA = idxA !== -1 ? idxA : 9999;
        const orderB = idxB !== -1 ? idxB : 9999;
        return orderA - orderB;
      });
    }

    // 1. 生成側邊欄選單
    sidebar.innerHTML = '';
    data.forEach((note, index) => {
      const li = document.createElement('li');
      li.className = `sidebar-item ${index === 0 ? 'active' : ''}`;
      li.textContent = note.title.split('：')[0]; // 簡短標題
      li.setAttribute('draggable', 'true');
      li.setAttribute('data-id', note.id);
      li.addEventListener('click', () => {
        document.querySelectorAll('#ai-sidebar-menu .sidebar-item').forEach(item => item.classList.remove('active'));
        li.classList.add('active');
        renderSingleAINote(note);

        // 點擊切換時，精準滾動至內容區頂部（考慮 Navbar 70px + 20px 間距 = 90px）
        const contentContainer = document.getElementById('ai-note-content');
        if (contentContainer) {
          const yOffset = -90;
          const y = contentContainer.getBoundingClientRect().top + window.scrollY + yOffset;
          window.scrollTo({ top: y, behavior: 'instant' });
        }
      });
      sidebar.appendChild(li);
    });

    // 啟用拖曳排序
    enableSidebarDragAndDrop(sidebar, 'ai-notes-order', data);

    // 2. 決定預設要渲染哪一個筆記 (支援 URL 參數)
    const urlParams = new URLSearchParams(window.location.search);
    const targetNoteId = urlParams.get('note');
    let matchedNote = null;
    let matchedIndex = 0;

    if (targetNoteId) {
      matchedNote = data.find((note, idx) => {
        if (note.id === targetNoteId) {
          matchedIndex = idx;
          return true;
        }
        return false;
      });
    }

    if (matchedNote) {
      // 移除原有的 active 狀態，並把目標 item 設為 active
      document.querySelectorAll('.sidebar-item').forEach((item, idx) => {
        if (idx === matchedIndex) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
      renderSingleAINote(matchedNote);
      // 精準滾動至內容區頂部
      setTimeout(() => {
        const contentContainer = document.getElementById('ai-note-content');
        if (contentContainer) {
          const yOffset = -90;
          const y = contentContainer.getBoundingClientRect().top + window.scrollY + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 100);
    } else if (data.length > 0) {
      renderSingleAINote(data[0]);
    }

  } catch (error) {
    console.error('載入 AI 筆記失敗:', error);
    contentContainer.innerHTML = `<p style="color: var(--accent-2)">載入筆記資料失敗，請檢查 JSON 檔案或使用伺服器環境運行。</p>`;
  }
}

function renderSingleAINote(note) {
  const container = document.getElementById('ai-note-content');
  if (!container) return;

  let stepsHTML = '';
  note.steps.forEach(step => {
    stepsHTML += `
      <div class="flowchart-node" data-step-name="${step.name}">
        <div class="node-num">${step.name.split('.')[0]}</div>
        <div class="node-text">
          <div class="node-title">${step.name}</div>
          <div class="node-desc">${step.details}</div>
        </div>
      </div>
    `;
  });

  // 如果是 RAG，加上箭頭視覺效果
  if (note.id === 'rag') {
    stepsHTML = `
      <div class="flowchart">
        ${note.steps.map((step, idx) => `
          <div class="flowchart-node">
            <div class="node-num">${idx + 1}</div>
            <div class="node-text">
              <div class="node-title">${step.name}</div>
              <div class="node-desc">${step.details}</div>
            </div>
          </div>
          ${idx < note.steps.length - 1 ? '<div class="flowchart-arrow">↓</div>' : ''}
        `).join('')}
      </div>
    `;
  } else if (note.id === 'object_detection') {
    stepsHTML = `
      <div class="flowchart">
        ${note.steps.map((step, idx) => {
          let stepImgHTML = '';
          if (idx === 0) {
            // 資料分布
            stepImgHTML = `<div class="note-img-wrapper"><img src="src/img/yolo_label_dist.png" alt="YOLO 資料集標註分布圖" class="note-img"></div>`;
          } else if (idx === 3) {
            // 訓練曲線
            stepImgHTML = `<div class="note-img-wrapper"><img src="src/img/yolo_train_curves.png" alt="YOLO 訓練與驗證曲線" class="note-img"></div>`;
          } else if (idx === 5) {
            // 混淆矩陣
            stepImgHTML = `<div class="note-img-wrapper"><img src="src/img/yolo_confusion_matrix.png" alt="YOLO 物件偵測混淆矩陣" class="note-img"></div>`;
          }
          return `
            <div class="flowchart-node detection-node">
              <div class="node-num">${idx + 1}</div>
              <div class="node-text" style="width: 100%;">
                <div class="node-title">${step.name}</div>
                <div class="node-desc">${step.details}</div>
                ${stepImgHTML}
              </div>
            </div>
            ${idx < note.steps.length - 1 ? '<div class="flowchart-arrow">↓</div>' : ''}
          `;
        }).join('')}
      </div>
    `;
  } else if (note.id === 'image_segmentation') {
    stepsHTML = `
      <div class="flowchart">
        ${note.steps.map((step, idx) => {
          let stepImgHTML = '';
          if (idx === 2) {
            // U-Net 架構圖
            stepImgHTML = `<div class="note-img-wrapper"><img src="src/img/unet_architecture.png" alt="U-Net 影像分割神經網路架構圖" class="note-img"></div>`;
          }
          return `
            <div class="flowchart-node detection-node">
              <div class="node-num">${idx + 1}</div>
              <div class="node-text" style="width: 100%;">
                <div class="node-title">${step.name}</div>
                <div class="node-desc">${step.details}</div>
                ${stepImgHTML}
              </div>
            </div>
            ${idx < note.steps.length - 1 ? '<div class="flowchart-arrow">↓</div>' : ''}
          `;
        }).join('')}
      </div>
    `;
  }

  // 混淆矩陣互動特有區塊
  let specialInteractiveHTML = '';
  if (note.id === 'confusion_matrix') {
    specialInteractiveHTML = `
      <h3>Interactive Matrix (點擊儲存格查看物理意義)</h3>
      <div class="matrix-container">
        <div class="matrix-grid">
          <div class="matrix-header"></div>
          <div class="matrix-header">預測 Positive</div>
          <div class="matrix-header">預測 Negative</div>
          <div class="matrix-header">真實 Positive</div>
          <div class="matrix-cell active" data-type="tp">
            <span class="matrix-cell-label">TP (真陽性)</span>
            <span class="matrix-cell-value">85</span>
          </div>
          <div class="matrix-cell" data-type="fn">
            <span class="matrix-cell-label">FN (偽陰性)</span>
            <span class="matrix-cell-value">15</span>
          </div>
          <div class="matrix-header">真實 Negative</div>
          <div class="matrix-cell" data-type="fp">
            <span class="matrix-cell-label">FP (偽陽性)</span>
            <span class="matrix-cell-value">10</span>
          </div>
          <div class="matrix-cell" data-type="tn">
            <span class="matrix-cell-label">TN (真陰性)</span>
            <span class="matrix-cell-value">190</span>
          </div>
        </div>
        <div class="matrix-explanation" id="matrix-exp">
          <h4>TP (True Positive) - 真陽性</h4>
          <p><strong>定義：</strong>實際為正樣本，且模型也預測為正樣本的數量。</p>
          <p style="margin-top:10px;"><strong>實例：</strong>病人生病，且檢測報告也顯示陽性（有病）。</p>
        </div>
      </div>
    `;
  }

  // 折線圖特有區塊
  if (note.id === 'loss_curves') {
    specialInteractiveHTML = `
      <h3>Epoch 指標動態折線模擬器 (拉動滑桿調整 Epoch)</h3>
      <div class="chart-sim-container">
        <div class="chart-svg-wrapper">
          <svg class="chart-svg" viewBox="0 0 500 250">
            <!-- 網格線 -->
            <line x1="50" y1="20" x2="50" y2="220" stroke="rgba(255,255,255,0.1)" stroke-width="1"/>
            <line x1="50" y1="220" x2="480" y2="220" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
            <line x1="50" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
            <line x1="50" y1="120" x2="480" y2="120" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
            
            <!-- X 軸標籤 -->
            <text x="50" y="240" fill="var(--text-muted)" font-size="10">Epoch 0</text>
            <text x="260" y="240" fill="var(--text-muted)" font-size="10" text-anchor="middle">Epoch 50 (過擬合轉折點)</text>
            <text x="470" y="240" fill="var(--text-muted)" font-size="10" text-anchor="end">Epoch 100</text>
            
            <!-- Y 軸標籤 -->
            <text x="25" y="25" fill="var(--text-muted)" font-size="10" text-anchor="middle">高 Loss</text>
            <text x="25" y="220" fill="var(--text-muted)" font-size="10" text-anchor="middle">低 Loss</text>

            <!-- Train Loss 曲線 (綠) -->
            <path id="train-loss-path" d="" fill="none" stroke="var(--accent-2)" stroke-width="3" stroke-dasharray="1000" stroke-dashoffset="0"/>
            
            <!-- Val Loss 曲線 (藍) -->
            <path id="val-loss-path" d="" fill="none" stroke="var(--accent-1)" stroke-width="3" stroke-dasharray="1000" stroke-dashoffset="0"/>
            
            <!-- 指標虛線 -->
            <line id="slider-line" x1="50" y1="20" x2="50" y2="220" stroke="rgba(255,255,255,0.4)" stroke-width="1" stroke-dasharray="4"/>
            <circle id="train-dot" cx="50" cy="220" r="6" fill="var(--accent-2)"/>
            <circle id="val-dot" cx="50" cy="220" r="6" fill="var(--accent-1)"/>
          </svg>
        </div>
        <div class="chart-slider-container">
          <span style="font-size:0.9rem; font-weight:700;">調整 Epoch: <span id="epoch-val" style="color:var(--accent-1)">0</span></span>
          <input type="range" min="0" max="100" value="0" class="chart-slider" id="epoch-slider">
        </div>
        <div class="matrix-explanation" style="margin-top: 20px;">
          <h4 id="chart-status-title">正常收斂階段 (Good Convergence)</h4>
          <p id="chart-status-desc">訓練剛開始，模型正在學習特徵，訓練集與驗證集損失皆在同步平穩下降。</p>
        </div>
      </div>
    `;
  }

  let formulasHTML = '';
  if (note.formulas && note.formulas.length > 0) {
    formulasHTML = `<h3>核心公式與物理意義 (Formulas)</h3>`;
    note.formulas.forEach(form => {
      formulasHTML += `
        <div class="math-block">
          <div class="math-title">${form.name}</div>
          <div class="math-latex">$$${form.latex}$$</div>
          <div class="faq-a" style="margin-top:10px; text-align:center;">${form.description}</div>
        </div>
      `;
    });
  }

  let codeHTML = '';
  if (note.code) {
    codeHTML = `
      <h3>PyTorch / Python 程式碼示範</h3>
      <pre><code class="language-python">${escapeHTML(note.code)}</code></pre>
    `;
  }

  let faqHTML = '';
  if (note.faq && note.faq.length > 0) {
    faqHTML = `<div class="faq-section"><div class="faq-title">💡 常見問題與解決對策 (FAQ)</div>`;
    note.faq.forEach(item => {
      faqHTML += `
        <div class="faq-card">
          <div class="faq-q">${item.question}</div>
          <div class="faq-a">${item.answer}</div>
        </div>
      `;
    });
    faqHTML += `</div>`;
  }

  container.innerHTML = `
    <h2 style="font-size:2rem; margin-bottom:10px; color:var(--text-main); font-weight:800;">${note.title}</h2>
    <p style="color:var(--accent-1); font-weight:600; font-size:1.1rem; margin-bottom:20px;">${note.englishTitle}</p>
    <p style="color:var(--text-muted); line-height:1.6; margin-bottom:30px; font-size:1rem;">${note.description}</p>
    
    <h3>演算法與處理步驟 (Process Flow)</h3>
    ${stepsHTML}
    
    ${specialInteractiveHTML}
    ${formulasHTML}
    ${codeHTML}
    ${faqHTML}
  `;

  // 觸發數學公式與代碼美化
  triggerKaTeX('ai-note-content');
  triggerPrism();

  // 註冊混淆矩陣互動點擊
  if (note.id === 'confusion_matrix') {
    registerMatrixClicks();
  }

  // 註冊折線圖滑動條與計算
  if (note.id === 'loss_curves') {
    registerChartSimulator();
  }
}

// 混淆矩陣互動點擊邏輯
function registerMatrixClicks() {
  const cells = document.querySelectorAll('.matrix-cell');
  const expBox = document.getElementById('matrix-exp');
  if (!expBox) return;

  const explMap = {
    tp: {
      title: "TP (True Positive) - 真陽性",
      def: "實際為正樣本，且模型也預測為正樣本的數量。",
      example: "病人生病，且檢測報告也顯示陽性（有病）。這代表模型篩檢成功。"
    },
    fn: {
      title: "FN (False Negative) - 偽陰性",
      def: "實際為正樣本，但模型錯誤預測為負樣本的數量 (漏報)。",
      example: "病人生病，但檢測報告顯示陰性（健康）。這非常危險，可能延誤治療！"
    },
    fp: {
      title: "FP (False Positive) - 偽陽性",
      def: "實際為負樣本，但模型錯誤預測為正樣本的數量 (虛報/誤報)。",
      example: "病人很健康，但檢測報告顯示陽性（有病）。會造成虛驚一場，需二度篩檢確認。"
    },
    tn: {
      title: "TN (True Negative) - 真陰性",
      def: "實際為負樣本，且模型也預測為負樣本的數量。",
      example: "病人健康，且檢測報告也顯示陰性（健康）。這代表模型正常排除。"
    }
  };

  cells.forEach(cell => {
    cell.addEventListener('click', () => {
      cells.forEach(c => c.classList.remove('active'));
      cell.classList.add('active');
      const type = cell.getAttribute('data-type');
      const data = explMap[type];
      expBox.innerHTML = `
        <h4 style="color: var(--accent-1);">${data.title}</h4>
        <p><strong>定義：</strong>${data.def}</p>
        <p style="margin-top:10px;"><strong>實例：</strong>${data.example}</p>
      `;
    });
  });
}

// 折線圖模擬邏輯
function registerChartSimulator() {
  const slider = document.getElementById('epoch-slider');
  const epochVal = document.getElementById('epoch-val');
  const sliderLine = document.getElementById('slider-line');
  const trainDot = document.getElementById('train-dot');
  const valDot = document.getElementById('val-dot');
  const statusTitle = document.getElementById('chart-status-title');
  const statusDesc = document.getElementById('chart-status-desc');

  if (!slider) return;

  // 生成曲線 path
  const trainLossPath = document.getElementById('train-loss-path');
  const valLossPath = document.getElementById('val-loss-path');

  // 計算 Loss 曲線坐標點 (X: 50~480, Y: 220~20)
  // X 範圍: 50 到 480，共 430px
  // Y 範圍: 220 (底部, Loss=0) 到 20 (頂部, Loss=最大)
  const epochsCount = 100;
  let trainPoints = [];
  let valPoints = [];

  for (let i = 0; i <= epochsCount; i++) {
    const x = 50 + (i / epochsCount) * 430;
    // Train Loss: 指數級下降 y = 20 + 200 * e^(-i/20)
    const trainY = 20 + 190 * Math.exp(-i / 25);
    trainPoints.push(`${x},${trainY}`);

    // Val Loss: 先降後升 (過擬合) y = 20 + 200 * e^(-i/20) + 攀升
    let valY;
    if (i <= 50) {
      valY = 25 + 180 * Math.exp(-i / 22);
    } else {
      // 50 epoch 後開始過擬合上升
      const baseVal = 25 + 180 * Math.exp(-50 / 22);
      valY = baseVal + Math.pow(i - 50, 1.8) * 0.08;
    }
    valPoints.push(`${x},${valY}`);
  }

  if (trainLossPath) trainLossPath.setAttribute('d', `M ${trainPoints.join(' L ')}`);
  if (valLossPath) valLossPath.setAttribute('d', `M ${valPoints.join(' L ')}`);

  const updateSim = () => {
    const epoch = parseInt(slider.value);
    epochVal.textContent = epoch;

    const x = 50 + (epoch / epochsCount) * 430;
    // 取得當前點 Y
    const trainY = 20 + 190 * Math.exp(-epoch / 25);
    let valY;
    if (epoch <= 50) {
      valY = 25 + 180 * Math.exp(-epoch / 22);
    } else {
      const baseVal = 25 + 180 * Math.exp(-50 / 22);
      valY = baseVal + Math.pow(epoch - 50, 1.8) * 0.08;
    }

    // 更新虛線位置
    sliderLine.setAttribute('x1', x);
    sliderLine.setAttribute('x2', x);

    // 更新點位置
    trainDot.setAttribute('cx', x);
    trainDot.setAttribute('cy', trainY);
    valDot.setAttribute('cx', x);
    valDot.setAttribute('cy', valY);

    // 更新狀態說明文字
    if (epoch < 30) {
      statusTitle.innerHTML = '🟢 訓練初期 (Early Training)';
      statusTitle.style.color = 'var(--accent-2)';
      statusDesc.textContent = '模型開始收斂，Train Loss 與 Val Loss 同步陡峭下降。這是模型快速學習通用特徵的階段。';
    } else if (epoch >= 30 && epoch <= 55) {
      statusTitle.innerHTML = '🔵 最佳配適期 (Sweet Spot - Epoch 45~50)';
      statusTitle.style.color = 'var(--accent-1)';
      statusDesc.textContent = '在此區間，驗證集 Loss 達到最低點，模型特徵泛化能力最強。這通常是我們停止訓練 (Early Stopping) 的理想節點！';
    } else {
      statusTitle.innerHTML = '🔴 過擬合階段 (Overfitting Block)';
      statusTitle.style.color = 'var(--accent-2)';
      statusDesc.textContent = '此時 Train Loss 仍在極限逼近 0，但 Val Loss 卻反彈大幅攀升。模型開始背誦訓練集雜訊，對未見過的測試資料適應力急遽衰退。應立即採用 Dropout、正則化或增加數據。';
    }
  };

  slider.addEventListener('input', updateSim);
  updateSim(); // 初始化
}

// --- 2. 硬體研究室渲染邏輯 ---
export async function loadAndRenderHardware() {
  const sidebar = document.getElementById('hardware-sidebar-menu');
  const container = document.getElementById('hardware-content-body');
  if (!sidebar || !container) return;

  try {
    const response = await fetch('src/data/hardware-notes.json');
    let data = await response.json();

    // 依照 localStorage 保存的順序排序
    const savedOrder = localStorage.getItem('hardware-notes-order');
    if (savedOrder) {
      const orderArray = JSON.parse(savedOrder);
      data.sort((a, b) => {
        const idxA = orderArray.indexOf(a.id);
        const idxB = orderArray.indexOf(b.id);
        const orderA = idxA !== -1 ? idxA : 9999;
        const orderB = idxB !== -1 ? idxB : 9999;
        return orderA - orderB;
      });
    }

    // 1. 生成左側大單元選單
    sidebar.innerHTML = '';
    data.forEach((group, index) => {
      const li = document.createElement('li');
      li.className = `sidebar-item ${index === 0 ? 'active' : ''}`;
      li.textContent = group.title;
      li.setAttribute('draggable', 'true');
      li.setAttribute('data-id', group.id);
      li.addEventListener('click', () => {
        document.querySelectorAll('#hardware-sidebar-menu .sidebar-item').forEach(item => item.classList.remove('active'));
        li.classList.add('active');
        renderHardwareDetail(group);
        
        // 點擊切換時，滾動至頁面頂部
        window.scrollTo({ top: 0, behavior: 'instant' });
      });
      sidebar.appendChild(li);
    });

    // 啟用拖曳排序
    enableSidebarDragAndDrop(sidebar, 'hardware-notes-order', data);

    // 2. 決定預設要渲染哪一個硬體群組 (支援 URL 參數)
    const urlParams = new URLSearchParams(window.location.search);
    const targetId = urlParams.get('id');
    let matchedGroup = null;
    let matchedIndex = 0;

    if (targetId) {
      matchedGroup = data.find((group, idx) => {
        if (group.id === targetId) {
          matchedIndex = idx;
          return true;
        }
        return false;
      });
    }

    if (matchedGroup) {
      document.querySelectorAll('#hardware-sidebar-menu .sidebar-item').forEach((item, idx) => {
        if (idx === matchedIndex) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
      renderHardwareDetail(matchedGroup);
    } else if (data.length > 0) {
      renderHardwareDetail(data[0]);
    }

  } catch (error) {
    console.error('載入硬體資料失敗:', error);
    container.innerHTML = `<p style="color: var(--accent-2)">載入硬體資料失敗，請檢查 JSON 檔案或使用伺服器環境運行。</p>`;
  }
}

function renderHardwareDetail(item) {
  const container = document.getElementById('hardware-content-body');
  if (!container) return;

  container.innerHTML = '';

  if (item.id === 'vulkan-gtx1080') {
    container.innerHTML = renderVulkanDashboard(item);
    bindVulkanEvents();
    return;
  }

  let specHTML = '';
  item.specs.forEach(spec => {
    specHTML += `
      <div class="hardware-spec-row">
        <div class="hardware-spec-name">${spec.name}</div>
        <div class="hardware-spec-value">${spec.value}</div>
        <div class="hardware-spec-desc">${spec.description}</div>
      </div>
    `;
  });

  let guidesHTML = '';
  if (item.guides && item.guides.length > 0) {
    guidesHTML = `
      <h3 style="margin-top: 30px; font-size: 1.15rem; color:var(--accent-1); border-bottom:1px solid var(--border-color); padding-bottom:5px;">推薦顯卡評估對比</h3>
      <table class="gpu-table">
        <thead>
          <tr>
            <th>型號</th>
            <th>推薦定位</th>
            <th>優勢</th>
            <th>劣勢</th>
          </tr>
        </thead>
        <tbody>
          ${item.guides.map(guide => `
            <tr>
              <td style="font-weight:700;">${guide.card}</td>
              <td style="color:var(--accent-2); font-weight:600;">${guide.recommendation}</td>
              <td>${guide.pros}</td>
              <td>${guide.cons}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  let faqHTML = '';
  if (item.faq && item.faq.length > 0) {
    faqHTML = `
      <div class="faq-section" style="margin-top: 30px;">
        <div class="faq-title" style="font-size:1.2rem; margin-bottom:15px;">💬 硬體常見問題與避坑指南</div>
        ${item.faq.map(f => `
          <div class="faq-card" style="padding:15px; margin-bottom:10px;">
            <div class="faq-q" style="font-size:0.95rem;">${f.question}</div>
            <div class="faq-a" style="font-size:0.85rem;">${f.answer}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  container.innerHTML = `
    <div class="hardware-card" data-id="${item.id}" style="width: 100%;">
      <div class="hardware-title-container">
        <h2 class="hardware-card-title">${item.title}</h2>
        <span style="color:var(--text-muted); font-size:0.85rem; font-weight:600; font-family:var(--font-mono);">${item.englishTitle}</span>
      </div>
      <p style="color:var(--text-muted); font-size:0.95rem; line-height:1.5; margin-bottom:25px;">${item.description}</p>
      
      <h3 style="font-size:1.15rem; color:var(--accent-1); margin-bottom:15px; border-bottom:1px solid var(--border-color); padding-bottom:5px;">核心參數科普 (Specifications)</h3>
      ${specHTML}
      
      ${guidesHTML}
      ${faqHTML}
    </div>
  `;
}



// --- 3. 指令集與終端模擬器渲染邏輯 ---
export async function loadAndRenderCommands() {
  const sidebar = document.getElementById('cmd-sidebar-menu');
  const terminalBody = document.getElementById('terminal-body');
  if (!sidebar || !terminalBody) return;

  try {
    const response = await fetch('src/data/commands-notes.json');
    let data = await response.json();

    // 依照 localStorage 保存的順序排序
    const savedOrder = localStorage.getItem('commands-notes-order');
    if (savedOrder) {
      const orderArray = JSON.parse(savedOrder);
      data.sort((a, b) => {
        const idxA = orderArray.indexOf(a.category);
        const idxB = orderArray.indexOf(b.category);
        const orderA = idxA !== -1 ? idxA : 9999;
        const orderB = idxB !== -1 ? idxB : 9999;
        return orderA - orderB;
      });
    }

    // 1. 生成左側大單元選單
    sidebar.innerHTML = '';
    data.forEach((group, index) => {
      const li = document.createElement('li');
      li.className = `sidebar-item ${index === 0 ? 'active' : ''}`;
      li.textContent = group.title;
      li.setAttribute('draggable', 'true');
      li.setAttribute('data-id', group.category);
      li.addEventListener('click', () => {
        document.querySelectorAll('#cmd-sidebar-menu .sidebar-item').forEach(item => item.classList.remove('active'));
        li.classList.add('active');
        renderCommandsForGroup(group);

        // 點擊切換時，精準滾動至終端機頂部（考慮 Navbar 70px + 20px 間距 = 90px）
        const terminalSimulator = document.querySelector('.terminal-simulator');
        if (terminalSimulator) {
          const yOffset = -90;
          const y = terminalSimulator.getBoundingClientRect().top + window.scrollY + yOffset;
          window.scrollTo({ top: y, behavior: 'instant' });
        }
      });
      sidebar.appendChild(li);
    });

    // 啟用拖曳排序
    enableSidebarDragAndDrop(sidebar, 'commands-notes-order', data);

    // 2. 決定預設要渲染哪一個指令群組 (支援 URL 參數)
    const urlParams = new URLSearchParams(window.location.search);
    const targetCat = urlParams.get('cat');
    let matchedGroup = null;
    let matchedIndex = 0;

    if (targetCat) {
      matchedGroup = data.find((group, idx) => {
        if (group.category === targetCat) {
          matchedIndex = idx;
          return true;
        }
        return false;
      });
    }

    if (matchedGroup) {
      // 移除原有的 active 狀態，並把目標 item 設為 active
      document.querySelectorAll('.sidebar-item').forEach((item, idx) => {
        if (idx === matchedIndex) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
      renderCommandsForGroup(matchedGroup);
      
      // 精準滾動至終端機頂部
      setTimeout(() => {
        const terminalSimulator = document.querySelector('.terminal-simulator');
        if (terminalSimulator) {
          const yOffset = -90;
          const y = terminalSimulator.getBoundingClientRect().top + window.scrollY + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 100);
    } else if (data.length > 0) {
      renderCommandsForGroup(data[0]);
    }

  } catch (error) {
    console.error('載入指令資料失敗:', error);
    terminalBody.innerHTML = `<div style="color:var(--accent-2)">載入指令失敗，請使用伺服器運行本網頁。</div>`;
  }
}

function renderCommandsForGroup(group) {
  const terminalBody = document.getElementById('terminal-body');
  if (!terminalBody) return;

  // 切換單元時，重設終端機內部滾動條
  terminalBody.scrollTop = 0;

  // 清空終端機
  terminalBody.innerHTML = '';

  // 輸出分類介紹訊息
  terminalBody.innerHTML += `
    <div class="terminal-output" style="color:var(--accent-1); font-weight:700; border-left: 2px solid var(--accent-1);">
      System Loaded: ${group.englishTitle}
      <br>Description: ${group.description}
    </div>
  `;

  // 渲染所有指令，帶有一鍵複製與自動打字互動
  group.commands.forEach((item, index) => {
    const cmdLine = document.createElement('div');
    cmdLine.className = 'terminal-input-line';

    const cleanCmd = item.cmd.replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // 複製按鈕與指令資訊
    cmdLine.innerHTML = `
      <span class="terminal-prompt">user@lab:~$</span>
      <div class="terminal-text">
        <span class="cmd-text" style="color:#ffffff; font-weight:600; cursor:pointer;" title="點擊模擬執行指令">${cleanCmd}</span>
        <br>
        <span style="color:var(--text-muted); font-size:0.85rem; font-family:var(--font-sans);">[ ${item.desc} ] : ${item.explanation}</span>
        <br>
        <button class="terminal-copy-btn" data-cmd="${item.cmd}">複製指令</button>
      </div>
    `;

    terminalBody.appendChild(cmdLine);

    // 註冊「點擊指令」模擬自動打字與動態結果
    const cmdText = cmdLine.querySelector('.cmd-text');
    cmdText.addEventListener('click', () => {
      simulateTerminalTyping(item.cmd, item.desc);
    });
  });

  // 加上 FAQ
  if (group.faq && group.faq.length > 0) {
    const faqContainer = document.createElement('div');
    faqContainer.className = 'faq-section';
    faqContainer.style.borderTop = '1px solid rgba(255,255,255,0.05)';
    faqContainer.style.marginTop = '30px';
    faqContainer.style.paddingTop = '20px';
    
    faqContainer.innerHTML = `<h3 style="color:#ffffff; font-family:var(--font-sans); margin-bottom:15px;">💡 本單元疑難排解 (Troubleshooting)</h3>`;
    
    group.faq.forEach(f => {
      faqContainer.innerHTML += `
        <div class="faq-card" style="font-family:var(--font-sans); margin-bottom:15px; background: rgba(255,255,255,0.01);">
          <div class="faq-q" style="font-size:0.95rem; color:var(--accent-1);">${f.question}</div>
          <div class="faq-a" style="font-size:0.85rem; margin-top:5px; color:var(--text-muted);">${f.answer}</div>
        </div>
      `;
    });
    
    terminalBody.appendChild(faqContainer);
  }

  // 註冊複製按鈕功能
  registerCopyBtns();
}

function registerCopyBtns() {
  const btns = document.querySelectorAll('.terminal-copy-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const textToCopy = btn.getAttribute('data-cmd');
      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = btn.textContent;
        btn.textContent = '✓ 已複製！';
        btn.style.color = '#27c93f';
        btn.style.borderColor = '#27c93f';
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.color = 'var(--text-muted)';
          btn.style.borderColor = 'var(--border-color)';
        }, 1500);
      }).catch(err => {
        console.error('無法複製指令:', err);
      });
    });
  });
}

// 模擬終端機打字效果
function simulateTerminalTyping(command, description) {
  const terminalBody = document.getElementById('terminal-body');
  if (!terminalBody) return;

  // 建立一個浮動覆蓋層或是直接在終端機底部彈出一個模擬終端會話視窗
  // 為了視覺效果，我們在畫面上建立一個美觀的 Modal 模擬終端機執行，或是在目前終端機頂部模擬
  // 這邊我們用最簡潔直觀的做法：在終端機最下方追加一個模擬的執行區塊
  const simulationDiv = document.createElement('div');
  simulationDiv.style.background = '#06070a';
  simulationDiv.style.border = '1px solid var(--accent-1)';
  simulationDiv.style.padding = '15px';
  simulationDiv.style.borderRadius = '8px';
  simulationDiv.style.marginTop = '20px';
  simulationDiv.style.boxShadow = '0 0 15px var(--glow-color)';
  simulationDiv.style.fontFamily = 'var(--font-mono)';

  simulationDiv.innerHTML = `
    <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:0.8rem; color:var(--accent-1); border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:5px;">
      <span>🐚 Bash Simulation Terminal</span>
      <span style="cursor:pointer;" class="close-sim-btn">✕ 關閉</span>
    </div>
    <div style="display:flex; align-items:center;">
      <span class="terminal-prompt">user@lab:~$</span>
      <span class="typing-text" style="color:#fff; font-weight:600;"></span>
    </div>
    <div class="simulation-output" style="margin-top:10px; color:#a1a5b8; font-size:0.85rem; display:none; white-space:pre-wrap;"></div>
  `;

  terminalBody.appendChild(simulationDiv);
  simulationDiv.scrollIntoView({ behavior: 'smooth' });

  // 關閉按鈕
  simulationDiv.querySelector('.close-sim-btn').addEventListener('click', () => {
    simulationDiv.remove();
  });

  const typingSpan = simulationDiv.querySelector('.typing-text');
  const outputDiv = simulationDiv.querySelector('.simulation-output');

  // 打字動畫
  let charIdx = 0;
  const typeChar = () => {
    if (charIdx < command.length) {
      typingSpan.textContent += command.charAt(charIdx);
      charIdx++;
      setTimeout(typeChar, 40);
    } else {
      // 打字結束，模擬載入後輸出結果
      setTimeout(() => {
        outputDiv.style.display = 'block';
        outputDiv.innerHTML = `Running command: "${command}" ...\n`;
        setTimeout(() => {
          outputDiv.innerHTML += getMockOutputForCommand(command);
          simulationDiv.scrollIntoView({ behavior: 'smooth' });
        }, 800);
      }, 300);
    }
  };

  typeChar();
}

function getMockOutputForCommand(cmd) {
  if (cmd.includes('nvidia-smi')) {
    return `+-----------------------------------------------------------------------------+
| NVIDIA-SMI 525.60.13    Driver Version: 525.60.13    CUDA Version: 12.0     |
|-------------------------------+----------------------+----------------------+
| GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
|                               |                      |               MIG M. |
|===============================+======================+======================|
|   0  NVIDIA GeForce ...  Off  | 00000000:01:00.0 Off |                  N/A |
| 35%   58C    P2    95W / 450W |   8420MiB / 24576MiB |    82%      Default |
|                               |                      |                  N/A |
+-------------------------------+----------------------+----------------------+
                                                                               
+-----------------------------------------------------------------------------+
| Processes:                                                                  |
|  GPU   GI   CI        PID   Type   Process name                  GPU Memory |
|        ID   ID                                                   Usage      |
|=============================================================================|
|    0   N/A  N/A      8419      C   python3 /workspace/train.py      8412MiB |
+-----------------------------------------------------------------------------+`;
  }
  
  if (cmd.includes('tmux new') || cmd.includes('tmux attach')) {
    return `[detached (from session main)]
Created session: "main" in background.
Use "tmux attach -t main" to monitor progress.`;
  }

  if (cmd.includes('df -h')) {
    return `Filesystem      Size  Used Avail Use% Mounted on
/dev/sda1        97G   34G   59G  37% /
tmpfs            64M     0   64M   0% /dev
/dev/sdb1       1.8T  420G  1.4T  24% /workspace (SSD Data)`;
  }

  if (cmd.includes('free -h')) {
    return `               total        used        free      shared  buff/cache   available
Mem:            62Gi        12Gi        38Gi       1.0Gi        11Gi        48Gi
Swap:           8.0Gi       256Mi       7.7Gi`;
  }

  if (cmd.includes('docker run')) {
    return `Unable to find image 'pytorch/pytorch:2.0.1-cuda11.7-cudnn8-devel' locally
2.0.1-cuda11.7-cudnn8-devel: Pulling from pytorch/pytorch
Digest: sha256:d8c1c4e97a39...
Status: Downloaded newer image for pytorch/pytorch:2.0.1
root@container_a9f8:/# python -c "import torch; print(torch.cuda.is_available())"
True`;
  }

  if (cmd.includes('torch.cuda.is_available()')) {
    return `>>> import torch
>>> torch.cuda.is_available()
True
>>> torch.cuda.get_device_name(0)
'NVIDIA GeForce RTX 4090'`;
  }

  if (cmd.includes('git status')) {
    return `On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
\tmodified:   src/data/ai-notes.json

no changes added to commit (use "git add" and/or "git commit -a")`;
  }

  return `Command executed successfully.
Exit Code: 0 (Success)`;
}

// HTML 逸出輔助函式
function escapeHTML(str) {
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
}

// --- 4. 網管學習實驗室渲染邏輯 ---
export async function loadAndRenderNetworkNotes() {
  const sidebar = document.getElementById('network-sidebar-menu');
  const contentContainer = document.getElementById('network-note-content');
  if (!sidebar || !contentContainer) return;

  try {
    const response = await fetch('src/data/network-notes.json');
    let data = await response.json();

    // 依照 localStorage 保存的順序排序
    const savedOrder = localStorage.getItem('network-notes-order');
    if (savedOrder) {
      const orderArray = JSON.parse(savedOrder);
      data.sort((a, b) => {
        const idxA = orderArray.indexOf(a.id);
        const idxB = orderArray.indexOf(b.id);
        const orderA = idxA !== -1 ? idxA : 9999;
        const orderB = idxB !== -1 ? idxB : 9999;
        return orderA - orderB;
      });
    }

    // 1. 生成側邊欄選單
    sidebar.innerHTML = '';
    data.forEach((note, index) => {
      const li = document.createElement('li');
      li.className = `sidebar-item ${index === 0 ? 'active' : ''}`;
      li.textContent = note.title;
      li.setAttribute('draggable', 'true');
      li.setAttribute('data-id', note.id);
      li.addEventListener('click', () => {
        document.querySelectorAll('#network-sidebar-menu .sidebar-item').forEach(item => item.classList.remove('active'));
        li.classList.add('active');
        renderSingleNetworkNote(note);

        // 點擊切換時，精準滾動至內容區頂部
        const contentContainer = document.getElementById('network-note-content');
        if (contentContainer) {
          const yOffset = -90;
          const y = contentContainer.getBoundingClientRect().top + window.scrollY + yOffset;
          window.scrollTo({ top: y, behavior: 'instant' });
        }
      });
      sidebar.appendChild(li);
    });

    // 啟用拖曳排序
    enableSidebarDragAndDrop(sidebar, 'network-notes-order', data);

    // 2. 決定預設要渲染哪一個筆記 (支援 URL 參數)
    const urlParams = new URLSearchParams(window.location.search);
    const targetNoteId = urlParams.get('note');
    let matchedNote = null;
    let matchedIndex = 0;

    if (targetNoteId) {
      matchedNote = data.find((note, idx) => {
        if (note.id === targetNoteId) {
          matchedIndex = idx;
          return true;
        }
        return false;
      });
    }

    if (matchedNote) {
      document.querySelectorAll('#network-sidebar-menu .sidebar-item').forEach((item, idx) => {
        if (idx === matchedIndex) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
      renderSingleNetworkNote(matchedNote);
      setTimeout(() => {
        const contentContainer = document.getElementById('network-note-content');
        if (contentContainer) {
          const yOffset = -90;
          const y = contentContainer.getBoundingClientRect().top + window.scrollY + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 100);
    } else if (data.length > 0) {
      renderSingleNetworkNote(data[0]);
    }

  } catch (error) {
    console.error('載入網管筆記失敗:', error);
    contentContainer.innerHTML = `<p style="color: var(--accent-2)">載入筆記資料失敗，請檢查 JSON 檔案或使用伺服器環境運行。</p>`;
  }
}

function renderSingleNetworkNote(note) {
  const container = document.getElementById('network-note-content');
  if (!container) return;

  let stepsHTML = '';
  note.steps.forEach((step, idx) => {
    stepsHTML += `
      <div class="flowchart-node detection-node">
        <div class="node-num">${idx + 1}</div>
        <div class="node-text" style="width: 100%;">
          <div class="node-title">${step.name}</div>
          <div class="node-desc">${step.details}</div>
        </div>
      </div>
      ${idx < note.steps.length - 1 ? '<div class="flowchart-arrow">↓</div>' : ''}
    `;
  });

  let faqHTML = '';
  if (note.faq && note.faq.length > 0) {
    faqHTML = `<div class="faq-section"><div class="faq-title">💡 常見問題與解決對策 (FAQ)</div>`;
    note.faq.forEach(item => {
      faqHTML += `
        <div class="faq-card">
          <div class="faq-q">${item.question}</div>
          <div class="faq-a">${item.answer}</div>
        </div>
      `;
    });
    faqHTML += `</div>`;
  }

  container.innerHTML = `
    <h2 style="font-size:2rem; margin-bottom:10px; color:var(--text-main); font-weight:800;">${note.title}</h2>
    <p style="color:var(--accent-1); font-weight:600; font-size:1.1rem; margin-bottom:20px;">${note.englishTitle}</p>
    <p style="color:var(--text-muted); line-height:1.6; margin-bottom:30px; font-size:1rem;">${note.description}</p>
    
    <h3>概念拆解與處理步驟 (Process Flow)</h3>
    <div class="flowchart">
      ${stepsHTML}
    </div>
    
    ${faqHTML}
  `;

  // 觸發數學公式與代碼美化
  triggerKaTeX('network-note-content');
  triggerPrism();
}

// ==========================================
// --- Vulkan & GTX 1080 監控台自訂邏輯 ---
// ==========================================

let currentVulkanData = {
  1: { score: "", fps: "", temp: "", power: "", result: "none", crash: "none" },
  2: { score: "", fps: "", temp: "", power: "", result: "none", crash: "none" },
  3: { score: "", fps: "", temp: "", power: "", result: "none", crash: "none" },
  4: { score: "", fps: "", temp: "", power: "", result: "none", crash: "none" },
  5: { score: "", fps: "", temp: "", power: "", result: "none", crash: "none" },
  6: { score: "", fps: "", temp: "", power: "", result: "none", crash: "none" }
};

const presetVulkanData = {
  1: { score: 5420, fps: 90, temp: 78, power: 180, result: "Pass", crash: "0" },
  2: { score: 5380, fps: 89, temp: 80, power: 182, result: "Pass", crash: "0" },
  3: { score: 5450, fps: 91, temp: 75, power: 178, result: "Pass", crash: "0" },
  4: { score: 5110, fps: 85, temp: 83, power: 185, result: "Pass", crash: "0" },
  5: { score: 3200, fps: 53, temp: 92, power: 150, result: "Fail", crash: "2" },
  6: { score: 5410, fps: 90, temp: 77, power: 179, result: "Pass", crash: "0" }
};

function renderVulkanDashboard(item) {
  let tbodyRows = '';
  for (let i = 1; i <= 6; i++) {
    const val = currentVulkanData[i];
    tbodyRows += `
      <tr data-gpu="${i}">
        <td style="font-weight: 700; color: var(--accent-1);">GPU #${i}</td>
        <td>
          <input type="number" class="vulkan-input score-input" data-gpu="${i}" value="${val.score}" placeholder="未輸入">
        </td>
        <td>
          <input type="number" class="vulkan-input fps-input" data-gpu="${i}" value="${val.fps}" placeholder="未輸入">
        </td>
        <td>
          <input type="number" class="vulkan-input temp-input" data-gpu="${i}" value="${val.temp}" placeholder="未輸入">
        </td>
        <td>
          <input type="number" class="vulkan-input power-input" data-gpu="${i}" value="${val.power}" placeholder="未輸入">
        </td>
        <td>
          <select class="vulkan-select result-select" data-gpu="${i}">
            <option value="none" ${val.result === 'none' ? 'selected' : ''}>請選擇</option>
            <option value="Pass" ${val.result === 'Pass' ? 'selected' : ''}>Pass</option>
            <option value="Fail" ${val.result === 'Fail' ? 'selected' : ''}>Fail</option>
          </select>
        </td>
        <td>
          <select class="vulkan-select crash-select" data-gpu="${i}">
            <option value="none" ${val.crash === 'none' ? 'selected' : ''}>請選擇</option>
            <option value="0" ${val.crash === '0' ? 'selected' : ''}>無</option>
            <option value="1" ${val.crash === '1' ? 'selected' : ''}>1 次</option>
            <option value="2" ${val.crash === '2' ? 'selected' : ''}>2 次以上</option>
          </select>
        </td>
      </tr>
    `;
  }

  return `
    <div class="hardware-card vulkan-dashboard-card" data-id="${item.id}" style="width: 100%;">
      <div class="hardware-title-container">
        <h2 class="hardware-card-title">${item.title}</h2>
        <span style="color:var(--text-muted); font-size:0.85rem; font-weight:600; font-family:var(--font-mono);">${item.englishTitle}</span>
      </div>
      <p style="color:var(--text-muted); font-size:0.95rem; line-height:1.5; margin-bottom:25px;">${item.description}</p>

      <!-- Vulkan & Gemini API 科普區塊 -->
      <div class="api-compare-grid">
        <div class="api-card info-glass">
          <div class="api-card-header">
            <span class="api-icon">🌋</span>
            <div>
              <h4 class="api-card-title" style="margin:0; font-size:1.05rem;">Vulkan API (底層與圖形)</h4>
              <p class="api-card-subtitle" style="margin:2px 0 0 0; font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono);">Low-Overhead & Close-to-Metal</p>
            </div>
          </div>
          <p class="api-card-desc" style="margin-top:12px; font-size:0.85rem; line-height:1.4; color:var(--text-muted);">${item.vulkanInfo.apiDefinition} Vulkan API 特點是<strong>${item.vulkanInfo.vulkanFeatures.join('、')}</strong>，能最直接地把 6 張 GTX 1080 顯示卡效能壓榨到極致。</p>
        </div>
        
        <div class="api-card info-glass">
          <div class="api-card-header">
            <span class="api-icon">♊</span>
            <div>
              <h4 class="api-card-title" style="margin:0; font-size:1.05rem;">Gemini API (雲端與模型)</h4>
              <p class="api-card-subtitle" style="margin:2px 0 0 0; font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono);">Cloud AI Model Interface</p>
            </div>
          </div>
          <p class="api-card-desc" style="margin-top:12px; font-size:0.85rem; line-height:1.4; color:var(--text-muted);">${item.vulkanInfo.geminiComparison}</p>
        </div>
      </div>

      <!-- 甜甜圈科普與 SOP 說明 -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; margin-top: 25px;">
        <div class="sop-section info-glass" style="padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
          <h3 style="font-size: 1.15rem; color: var(--accent-1); margin-bottom: 12px; display: flex; align-items: center; gap: 8px; margin-top:0;">
            🍩 「甜甜圈」FurMark 2 與 SOP
          </h3>
          <div style="font-size: 0.9rem; line-height: 1.5;">
            <p style="color: var(--text-main); font-weight: 600; margin-bottom: 4px; margin-top:0;">什麼是「甜甜圈」？</p>
            <p style="color: var(--text-muted); margin-bottom: 10px;">FurMark 運行時畫面中央那顆毛茸茸的環狀物體。它使用極限著色器程式負載來極限壓榨 GPU 的發熱與運算，是超頻界與硬體研究中最經典的「燒機」畫面。</p>
            <p style="color: var(--text-main); font-weight: 600; margin-bottom: 4px; margin-top:0;">測試 SOP 規範：</p>
            <ul style="color: var(--text-muted); padding-left: 15px; margin: 0;">
              <li><strong>效能測試</strong>：${item.vulkanInfo.sop.benchmark}</li>
              <li><strong>壓力測試</strong>：${item.vulkanInfo.sop.stress}</li>
            </ul>
          </div>
        </div>

        <div class="practice-section info-glass" style="padding: 20px; border-radius: 12px; border: 1px solid rgba(245, 158, 11, 0.3); background: rgba(245, 158, 11, 0.02);">
          <h3 style="font-size: 1.15rem; color: #f59e0b; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; margin-top:0;">
            ⚠️ 系統環境與換卡安全鐵則
          </h3>
          <div style="font-size: 0.9rem; line-height: 1.5;">
            <p style="color: var(--text-main); font-weight: 600; margin-bottom: 4px; margin-top:0;">🔄 換卡免重灌系統</p>
            <p style="color: var(--text-muted); margin-bottom: 10px;">${item.vulkanInfo.envAndSwapPractice.noOsReinstall}</p>
            
            <p style="color: var(--text-main); font-weight: 600; margin-bottom: 4px; margin-top:0;">📋 正確的測試準備流程</p>
            <ol style="color: var(--text-muted); padding-left: 15px; margin: 0 0 10px 0;">
              ${item.vulkanInfo.envAndSwapPractice.preparationSOP.map(step => `<li>${step}</li>`).join('')}
            </ol>

            <p style="color: #ef4444; font-weight: 700; margin-bottom: 2px;">🚨 換卡安全鐵則：</p>
            <p style="color: #ef4444; font-weight: 600; margin: 0;">${item.vulkanInfo.envAndSwapPractice.safetyRule}</p>
          </div>
        </div>
      </div>

      <!-- 儀表板控制區 -->
      <div id="vulkan-dashboard" style="margin-top: 35px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 15px;">
          <h3 style="font-size: 1.25rem; color: var(--accent-1); margin: 0;">📊 6× GTX 1080 測試數據錄入台</h3>
          <div style="display: flex; gap: 10px;">
            <button id="btn-load-vulkan-preset" class="vulkan-btn btn-secondary">⚡ 預載學長測試數據</button>
            <button id="btn-clear-vulkan-data" class="vulkan-btn btn-danger">🗑️ 清空數據</button>
          </div>
        </div>

        <!-- 數據輸入表格 -->
        <div class="vulkan-table-container">
          <table class="vulkan-table">
            <thead>
              <tr>
                <th>GPU 編號</th>
                <th>[效能] Score (分數)</th>
                <th>[效能] Avg FPS</th>
                <th>[壓力] Max Temp (°C)</th>
                <th>[壓力] Max Power (W)</th>
                <th>[壓力] 狀態</th>
                <th>崩潰次數</th>
              </tr>
            </thead>
            <tbody id="vulkan-tbody">
              ${tbodyRows}
            </tbody>
          </table>
        </div>

        <!-- 圖表區 -->
        <div class="vulkan-charts-section" style="margin-top: 35px; display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 30px;">
          <div class="chart-container info-glass" style="padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
            <h4 style="color: var(--accent-1); margin-top: 0; margin-bottom: 15px; font-size: 1rem;">🔥 效能得分與平均 FPS 對比</h4>
            <div id="performance-chart" class="bar-chart-y">
              <!-- JS 動態生成長條 -->
            </div>
          </div>
          
          <div class="chart-container info-glass" style="padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
            <h4 style="color: var(--accent-2); margin-top: 0; margin-bottom: 15px; font-size: 1rem;">🌡️ 燒機最高溫度與功耗對比</h4>
            <div id="temperature-chart" class="bar-chart-y">
              <!-- JS 動態生成長條 -->
            </div>
          </div>
        </div>

        <!-- 匯出報告按鈕 -->
        <div style="margin-top: 30px; text-align: center;">
          <button id="btn-generate-report" class="vulkan-btn btn-primary" style="font-size: 1rem; padding: 12px 30px;">
            📄 一鍵生成向學長匯報的報告 (Markdown)
          </button>
        </div>
      </div>
    </div>

    <!-- Markdown 報告彈窗 (Modal) -->
    <div id="report-modal" class="vulkan-modal">
      <div class="vulkan-modal-content">
        <div class="vulkan-modal-header" style="display:flex; justify-content:space-between; align-items:center;">
          <h3 style="margin:0; font-size:1.25rem;">📋 顯卡效能與燒機測試報告</h3>
          <span class="vulkan-modal-close" id="btn-close-modal" style="font-size:1.5rem; cursor:pointer;">&times;</span>
        </div>
        <div class="vulkan-modal-body">
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 10px; text-align:left;">點擊下方按鈕複製 Markdown，即可直接貼到您的報告、HackMD、GitHub 或通訊軟體回報給學長。</p>
          <textarea id="report-textarea" readonly style="width: 100%; height: 350px; background: #08090d; color: #a9b2c3; border: 1px solid var(--border-color); border-radius: 8px; padding: 15px; font-family: var(--font-mono); font-size: 0.85rem; resize: none; box-sizing: border-box;"></textarea>
        </div>
        <div class="vulkan-modal-footer" style="display:flex; justify-content: flex-end; gap:10px; margin-top: 15px;">
          <button id="btn-copy-report" class="vulkan-btn btn-primary">📋 複製報告至剪貼簿</button>
          <button id="btn-close-modal-foot" class="vulkan-btn btn-secondary">關閉</button>
        </div>
      </div>
    </div>
  `;
}

function bindVulkanEvents() {
  const tbody = document.getElementById('vulkan-tbody');
  if (!tbody) return;

  // 1. 監聽所有的 input 與 select 變更
  const inputs = tbody.querySelectorAll('.vulkan-input, .vulkan-select');
  inputs.forEach(el => {
    el.addEventListener('input', () => {
      saveCurrentVulkanInput();
      updateVulkanCharts();
    });
    el.addEventListener('change', () => {
      saveCurrentVulkanInput();
      updateVulkanCharts();
    });
  });

  // 2. 預載數據按鈕
  const btnLoad = document.getElementById('btn-load-vulkan-preset');
  if (btnLoad) {
    btnLoad.addEventListener('click', () => {
      for (let i = 1; i <= 6; i++) {
        const data = presetVulkanData[i];
        document.querySelector(`.score-input[data-gpu="${i}"]`).value = data.score;
        document.querySelector(`.fps-input[data-gpu="${i}"]`).value = data.fps;
        document.querySelector(`.temp-input[data-gpu="${i}"]`).value = data.temp;
        document.querySelector(`.power-input[data-gpu="${i}"]`).value = data.power;
        document.querySelector(`.result-select[data-gpu="${i}"]`).value = data.result;
        document.querySelector(`.crash-select[data-gpu="${i}"]`).value = data.crash;
      }
      saveCurrentVulkanInput();
      updateVulkanCharts();
    });
  }

  // 3. 清空數據按鈕
  const btnClear = document.getElementById('btn-clear-vulkan-data');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      inputs.forEach(el => {
        if (el.tagName === 'INPUT') {
          el.value = '';
        } else if (el.tagName === 'SELECT') {
          el.value = 'none';
        }
      });
      saveCurrentVulkanInput();
      updateVulkanCharts();
    });
  }

  // 4. Modal 控制
  const modal = document.getElementById('report-modal');
  const btnGen = document.getElementById('btn-generate-report');
  const btnCloseX = document.getElementById('btn-close-modal');
  const btnCloseFoot = document.getElementById('btn-close-modal-foot');
  const txtArea = document.getElementById('report-textarea');

  if (modal && btnGen && txtArea) {
    btnGen.addEventListener('click', () => {
      const mdReport = generateMarkdownReport();
      txtArea.value = mdReport;
      modal.classList.add('active');
    });

    const closeModal = () => modal.classList.remove('active');
    if (btnCloseX) btnCloseX.addEventListener('click', closeModal);
    if (btnCloseFoot) btnCloseFoot.addEventListener('click', closeModal);
    
    // 點擊 Modal 背景也可關閉
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  // 5. 複製功能
  const btnCopy = document.getElementById('btn-copy-report');
  if (btnCopy && txtArea) {
    btnCopy.addEventListener('click', () => {
      txtArea.select();
      txtArea.setSelectionRange(0, 99999); // 手機相容性
      
      navigator.clipboard.writeText(txtArea.value).then(() => {
        const originalText = btnCopy.textContent;
        btnCopy.textContent = '✅ 已複製報告！';
        btnCopy.style.background = '#10b981';
        setTimeout(() => {
          btnCopy.textContent = originalText;
          btnCopy.style.background = '';
        }, 2000);
      }).catch(err => {
        console.error('複製失敗:', err);
        alert('複製失敗，請手動全選複製文字框內容。');
      });
    });
  }

  // 初始化繪製一次
  updateVulkanCharts();
}

function saveCurrentVulkanInput() {
  for (let i = 1; i <= 6; i++) {
    currentVulkanData[i].score = document.querySelector(`.score-input[data-gpu="${i}"]`).value;
    currentVulkanData[i].fps = document.querySelector(`.fps-input[data-gpu="${i}"]`).value;
    currentVulkanData[i].temp = document.querySelector(`.temp-input[data-gpu="${i}"]`).value;
    currentVulkanData[i].power = document.querySelector(`.power-input[data-gpu="${i}"]`).value;
    currentVulkanData[i].result = document.querySelector(`.result-select[data-gpu="${i}"]`).value;
    currentVulkanData[i].crash = document.querySelector(`.crash-select[data-gpu="${i}"]`).value;
  }
}

function updateVulkanCharts() {
  const perfChart = document.getElementById('performance-chart');
  const tempChart = document.getElementById('temperature-chart');
  if (!perfChart || !tempChart) return;
  
  perfChart.innerHTML = '';
  tempChart.innerHTML = '';
  
  for (let i = 1; i <= 6; i++) {
    const scoreVal = parseFloat(document.querySelector(`.score-input[data-gpu="${i}"]`).value) || 0;
    const fpsVal = parseFloat(document.querySelector(`.fps-input[data-gpu="${i}"]`).value) || 0;
    const tempVal = parseFloat(document.querySelector(`.temp-input[data-gpu="${i}"]`).value) || 0;
    const powerVal = parseFloat(document.querySelector(`.power-input[data-gpu="${i}"]`).value) || 0;
    const resultVal = document.querySelector(`.result-select[data-gpu="${i}"]`).value;
    
    // 效能長條圖
    const perfPercent = Math.min((scoreVal / 6000) * 100, 100);
    let perfBarColor = 'var(--accent-1)';
    if (resultVal === 'Fail') perfBarColor = 'rgba(239, 68, 68, 0.7)'; // 故障變紅色
    
    perfChart.innerHTML += `
      <div class="chart-row" style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
        <div class="chart-gpu-name" style="width: 60px; font-weight:700; font-size:0.85rem; color:var(--text-main);">GPU #${i}</div>
        <div class="chart-bar-container" style="flex: 1; height: 10px; background: rgba(255,255,255,0.05); border-radius: 5px; overflow: hidden; margin: 0 15px; position:relative;">
          <div class="chart-bar" style="height: 100%; width: ${perfPercent}%; background: ${perfBarColor}; border-radius: 5px; transition: width 0.4s cubic-bezier(0.1, 0.8, 0.3, 1);"></div>
        </div>
        <div class="chart-gpu-val" style="width: 110px; text-align: right; font-family: var(--font-mono); font-size: 0.8rem; font-weight: 600;">
          ${scoreVal > 0 ? `${scoreVal} <span style="color:var(--text-muted); font-size:0.75rem;">(${fpsVal} FPS)</span>` : '<span style="color:var(--text-muted)">未錄入</span>'}
        </div>
      </div>
    `;
    
    // 溫度與功耗長條圖
    const tempPercent = Math.min((tempVal / 100) * 100, 100);
    let tempBarColor = 'var(--accent-2)';
    if (tempVal >= 90) {
      tempBarColor = '#ef4444'; // 嚴重過熱
    } else if (tempVal >= 82) {
      tempBarColor = '#f59e0b'; // 高溫預警
    }
    
    tempChart.innerHTML += `
      <div class="chart-row" style="margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between;">
        <div class="chart-gpu-name" style="width: 60px; font-weight:700; font-size:0.85rem; color:var(--text-main);">GPU #${i}</div>
        <div class="chart-bar-container" style="flex: 1; height: 10px; background: rgba(255,255,255,0.05); border-radius: 5px; overflow: hidden; margin: 0 15px; position:relative;">
          <div class="chart-bar" style="height: 100%; width: ${tempPercent}%; background: ${tempBarColor}; border-radius: 5px; transition: width 0.4s cubic-bezier(0.1, 0.8, 0.3, 1);"></div>
        </div>
        <div class="chart-gpu-val" style="width: 110px; text-align: right; font-family: var(--font-mono); font-size: 0.8rem; font-weight: 600;">
          ${tempVal > 0 ? `${tempVal}°C <span style="color:var(--text-muted); font-size:0.75rem;">/ ${powerVal}W</span>` : '<span style="color:var(--text-muted)">未錄入</span>'}
        </div>
      </div>
    `;
  }
}

function generateMarkdownReport() {
  const rows = [];
  let normalCount = 0;
  let warnCount = 0;
  let failCount = 0;
  
  for (let i = 1; i <= 6; i++) {
    const scoreVal = currentVulkanData[i].score || '未填';
    const fpsVal = currentVulkanData[i].fps || '未填';
    const tempVal = currentVulkanData[i].temp || '未填';
    const powerVal = currentVulkanData[i].power || '未填';
    const resultVal = currentVulkanData[i].result;
    const crashVal = currentVulkanData[i].crash;
    
    let crashDesc = '無';
    if (crashVal === '1') crashDesc = '1 次';
    if (crashVal === '2') crashDesc = '2 次以上';
    
    rows.push({
      id: `GPU #${i}`,
      score: scoreVal,
      fps: fpsVal,
      temp: tempVal > 0 ? `${tempVal}°C` : '未填',
      power: powerVal > 0 ? `${powerVal}W` : '未填',
      result: resultVal === 'none' ? '未定' : resultVal,
      crash: crashDesc
    });
    
    if (resultVal === 'Pass') {
      if (parseFloat(tempVal) >= 82) {
        warnCount++;
      } else {
        normalCount++;
      }
    } else if (resultVal === 'Fail') {
      failCount++;
    }
  }
  
  // 組裝 Markdown 表格
  let tableMarkdown = '| GPU 編號 | Benchmark 分數 | 平均幀率 (Avg FPS) | 燒機最高溫度 | 燒機最大功耗 | 測試狀態 | 崩潰與異常 |\n';
  tableMarkdown += '| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n';
  rows.forEach(r => {
    tableMarkdown += `| ${r.id} | ${r.score} | ${r.fps} | ${r.temp} | ${r.power} | ${r.result} | ${r.crash} |\n`;
  });
  
  // 組裝分析
  let analysisMarkdown = '';
  if (normalCount > 0) {
    analysisMarkdown += `- **正常運作卡片 (${normalCount} 張)**：效能分數與幀率表現穩定，燒機溫度與功耗均處於合理範圍（75°C~80°C，178W~182W），屬 Pascal 架構在 Vulkan API 模式下的標準高效能表現。\n`;
  }
  if (warnCount > 0) {
    analysisMarkdown += `- **散熱預警卡片 (${warnCount} 張)**：雖通過壓力測試，但燒機溫度偏高 (>= 82°C)。這會限制顯卡長時間運作的穩定性，甚至因高溫降頻影響算力。建議清理散熱鰭片灰塵並注意機殼內風道。\n`;
  }
  if (failCount > 0) {
    analysisMarkdown += `- **故障/異常卡片 (${failCount} 張)**：測試狀態為 Fail，且伴隨嚴重過熱降頻或燒機中途崩潰。硬體可能面臨風扇損壞、散熱膏乾涸或供電模組老化，需立即拆解維護或檢修。\n`;
  }
  
  const nowStr = new Date().toLocaleString('zh-TW');
  const md = `# 6× GTX 1080 顯示卡效能與 Vulkan 燒機測試報告

- **報告生成時間**：${nowStr}
- **測試對象**：NVIDIA GeForce GTX 1080 * 6 (Pascal 架構)
- **測試 API 與工具**：Vulkan API / FurMark 2 (甜甜圈)

## 一、 測試數據彙整表

${tableMarkdown}

## 二、 測試結果與硬體健康度分析

${analysisMarkdown}

## 三、 Vulkan API 壓榨測試心得
Vulkan API 具備低開銷 (Low-Overhead) 與靠近底層 (Close-to-Metal) 的硬體控制優勢，能夠最大化減低 CPU 驅動層開銷，使 6 張顯卡的 GPU 負載與發熱量在極短時間內攀升至最高值。這對於檢測像 GTX 1080 這類經典 Pascal 顯卡在極限高負載下的供電穩定性、降頻保護機制與風扇散熱健康度，是極為精準且高效的測試方案。

## 四、 系統環境與換卡實務建議
- **免重灌系統驗證**：6 張測試卡均為同型號 GTX 1080，共用 NVIDIA 驅動程式，換卡測試時無需重新安裝系統，直接拔換即可。
- **Ubuntu 測試環境配置 SOP**：
  1. 安裝好 Ubuntu 系統。
  2. 安裝好 NVIDIA 顯示卡驅動（確認 Vulkan 相關套件運作正常）。
  3. 即可開始 6 張顯卡的效能與壓力測試。
- **🚨 換卡安全鐵則**：務必先關機、拔掉電源線後再進行顯示卡插拔更換，切勿帶電作業，以防燒毀硬體！

---
報告人：[請在此填寫您的姓名]`;

  return md;
}

