// --- 線上編輯器核心邏輯 (Admin Control Panel) ---

// 1. 全域資料狀態
let currentDataSource = 'test-notes.json';
let fileData = []; // 記憶體中完整的資料陣列
let selectedIndex = -1; // 當前正在編輯的主題索引
let isModified = false; // 是否有未儲存的修改

// 2. 欄位配置對照表 (各個 JSON 檔案的子項目結構)
const SCHEMA_CONFIGS = {
  'test-notes.json': {
    idField: 'id',
    hasCode: false,
    subSections: [
      { key: 'specs', title: '⚙️ 測試規格', fields: [{ name: 'name', label: '規格名稱' }, { name: 'value', label: '數值' }, { name: 'description', label: '說明', type: 'textarea' }] },
      { key: 'guides', title: '📖 測試指南', fields: [{ name: 'card', label: '顯示卡' }, { name: 'recommendation', label: '推薦指數' }, { name: 'pros', label: '優點' }, { name: 'cons', label: '缺點' }] },
      { key: 'faq', title: '❓ 常見問題', fields: [{ name: 'question', label: '問題' }, { name: 'answer', label: '回答', type: 'textarea' }] }
    ]
  },
  'ai-notes.json': {
    idField: 'id',
    hasCode: true,
    subSections: [
      { key: 'steps', title: '🔢 實作步驟 (Steps)', fields: [{ name: 'name', label: '步驟名稱' }, { name: 'details', label: '步驟細節 (支援 HTML/Markdown)', type: 'textarea' }] },
      { key: 'formulas', title: '🧮 數學公式 (Formulas)', fields: [{ name: 'name', label: '公式名稱' }, { name: 'latex', label: 'LaTeX 語法 (例如: \\sum_{i=1}^n i)' }, { name: 'description', label: '公式說明', type: 'textarea' }] }
    ]
  },
  'hardware-notes.json': {
    idField: 'id',
    hasCode: false,
    subSections: [
      { key: 'specs', title: '⚙️ 規格指標 (Specs)', fields: [{ name: 'name', label: '指標名稱' }, { name: 'value', label: '關鍵值' }, { name: 'description', label: '說明', type: 'textarea' }] },
      { key: 'guides', title: '💡 選購指南 (Guides)', fields: [{ name: 'card', label: '型號/名稱' }, { name: 'recommendation', label: '推薦建議' }, { name: 'pros', label: '優點' }, { name: 'cons', label: '缺點' }] },
      { key: 'faq', title: '❓ 常見問答 (FAQ)', fields: [{ name: 'question', label: '問題' }, { name: 'answer', label: '回答', type: 'textarea' }] }
    ]
  },
  'network-notes.json': {
    idField: 'id',
    hasCode: false,
    subSections: [
      { key: 'steps', title: '🔢 知識步驟 / 壓線實務 (Steps)', fields: [{ name: 'name', label: '步驟標題' }, { name: 'summary', label: '概要資訊 (支援 HTML/Markdown)' }, { name: 'details', label: '詳細說明 (支援 HTML/Markdown)', type: 'textarea' }] },
      { key: 'faq', title: '❓ 常見問答 (FAQ)', fields: [{ name: 'question', label: '問題' }, { name: 'answer', label: '回答', type: 'textarea' }] }
    ]
  },
  'commands-notes.json': {
    idField: 'category', // 特殊：指令集使用 category 作為 ID
    hasCode: false,
    subSections: [
      { key: 'commands', title: '💻 指令集 (Commands)', fields: [{ name: 'cmd', label: '終端機指令' }, { name: 'desc', label: '指令名稱' }, { name: 'explanation', label: '功能與參數詳解', type: 'textarea' }] }
    ]
  }
};

// 3. 初始化 DOM 載入與監聽事件
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupEventListeners();
  loadCredentials();
});

// 初始化應用
async function initApp() {
  const select = document.getElementById('data-source-select');
  currentDataSource = select.value;
  await loadData(currentDataSource);
}

// 監聽事件設定
function setupEventListeners() {
  // 選擇檔案切換
  document.getElementById('data-source-select').addEventListener('change', async (e) => {
    if (isModified) {
      if (!confirm('您有未儲存的變更，確定要切換並捨棄變更嗎？')) {
        e.target.value = currentDataSource;
        return;
      }
    }
    currentDataSource = e.target.value;
    selectedIndex = -1;
    isModified = false;
    updateSyncStatus(false);
    document.getElementById('edit-form').style.display = 'none';
    document.getElementById('no-selection-view').style.display = 'flex';
    await loadData(currentDataSource);
  });

  // 新增主題
  document.getElementById('add-topic-btn').addEventListener('click', () => {
    addNewTopic();
  });

  // 刪除主題
  document.getElementById('delete-topic-btn').addEventListener('click', () => {
    deleteTopic();
  });

  // 基礎欄位即時變更監聽，標記「未儲存」
  const inputs = ['topic-id', 'topic-english', 'topic-title', 'topic-desc', 'topic-code'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        if (selectedIndex !== -1) {
          syncFormToMemory();
          updateSyncStatus(true);
        }
      });
    }
  });

  // 本地暫存（下載備份）
  document.getElementById('save-local-btn').addEventListener('click', () => {
    downloadJsonBackup();
  });

  // 發佈到 GitHub
  document.getElementById('publish-github-btn').addEventListener('click', () => {
    publishToGitHub();
  });

  // 預覽與編輯 Tab 切換
  const btnShowEditor = document.getElementById('btn-show-editor');
  const btnShowPreview = document.getElementById('btn-show-preview');
  const previewPanel = document.getElementById('preview-panel');
  const editFields = document.querySelectorAll('.admin-form > .form-group, .admin-form > .form-row, .admin-form > .sub-items-section');

  btnShowEditor.addEventListener('click', () => {
    btnShowEditor.classList.add('active');
    btnShowPreview.classList.remove('active');
    previewPanel.style.display = 'none';
    editFields.forEach(el => {
      if (el.id === 'code-group' && !SCHEMA_CONFIGS[currentDataSource].hasCode) return;
      el.style.display = 'flex';
    });
  });

  btnShowPreview.addEventListener('click', () => {
    btnShowEditor.classList.remove('active');
    btnShowPreview.classList.add('active');
    editFields.forEach(el => el.style.display = 'none');
    previewPanel.style.display = 'block';
    renderPreview();
  });

  // Token Modal 控制
  const tokenModal = document.getElementById('token-modal');
  document.getElementById('token-settings-btn').addEventListener('click', () => {
    tokenModal.style.display = 'flex';
  });
  document.getElementById('modal-close-btn').addEventListener('click', () => {
    tokenModal.style.display = 'none';
  });
  document.getElementById('btn-cancel-token').addEventListener('click', () => {
    tokenModal.style.display = 'none';
  });
  document.getElementById('btn-save-token').addEventListener('click', () => {
    saveCredentials();
    tokenModal.style.display = 'none';
  });

  // Token 顯示/隱藏切換
  const tokenInput = document.getElementById('github-token');
  const toggleTokenBtn = document.getElementById('toggle-token-visibility');
  toggleTokenBtn.addEventListener('click', () => {
    if (tokenInput.type === 'password') {
      tokenInput.type = 'text';
      toggleTokenBtn.textContent = '隱藏';
    } else {
      tokenInput.type = 'password';
      toggleTokenBtn.textContent = '顯示';
    }
  });
}

// 4. 讀取資料
async function loadData(filename) {
  const topicList = document.getElementById('admin-topic-list');
  topicList.innerHTML = '<li class="sidebar-item loading">正在載入 JSON...</li>';
  
  try {
    // 優先抓取本地 Vite server 提供的新 JSON 檔
    const response = await fetch(`src/data/${filename}?t=${Date.now()}`);
    if (!response.ok) throw new Error('無法讀取檔案');
    fileData = await response.json();
    renderTopicList();
  } catch (error) {
    console.error('載入資料失敗:', error);
    topicList.innerHTML = '<li class="sidebar-item loading" style="color: #ef4444;">載入失敗，確認檔案是否存在</li>';
    fileData = [];
  }
}

// 5. 渲染左側主題列表
function renderTopicList() {
  const topicList = document.getElementById('admin-topic-list');
  topicList.innerHTML = '';
  
  const config = SCHEMA_CONFIGS[currentDataSource];
  const idKey = config.idField;

  if (fileData.length === 0) {
    topicList.innerHTML = '<li class="sidebar-item loading">無主題資料</li>';
    return;
  }

  fileData.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = `sidebar-item ${index === selectedIndex ? 'active' : ''}`;
    li.setAttribute('data-index', index);
    
    const titleText = item.title || '(無標題)';
    const idText = item[idKey] || 'no-id';
    
    li.innerHTML = `
      <span>${titleText} <small style="opacity:0.7">(${idText})</small></span>
    `;

    li.addEventListener('click', () => {
      if (isModified && index !== selectedIndex) {
        if (!confirm('您有未儲存的變更，確定要切換主題並捨棄變更嗎？')) return;
      }
      selectTopic(index);
    });
    
    topicList.appendChild(li);
  });
}

// 6. 選取主題並填寫表單
function selectTopic(index) {
  selectedIndex = index;
  isModified = false;
  updateSyncStatus(false);

  // 切換選單 Active 狀態
  const items = document.querySelectorAll('#admin-topic-list .sidebar-item');
  items.forEach((item, idx) => {
    if (idx === index) item.classList.add('active');
    else item.classList.remove('active');
  });

  const item = fileData[index];
  const config = SCHEMA_CONFIGS[currentDataSource];

  // 填寫基本資料
  document.getElementById('topic-id').value = item[config.idField] || '';
  document.getElementById('topic-english').value = item.englishTitle || '';
  document.getElementById('topic-title').value = item.title || '';
  document.getElementById('topic-desc').value = item.description || '';

  // 處理 Code 區塊
  const codeGroup = document.getElementById('code-group');
  if (config.hasCode) {
    codeGroup.style.display = 'flex';
    document.getElementById('topic-code').value = item.code || '';
  } else {
    codeGroup.style.display = 'none';
  }

  // 重置選單狀態
  const btnShowEditor = document.getElementById('btn-show-editor');
  const btnShowPreview = document.getElementById('btn-show-preview');
  const previewPanel = document.getElementById('preview-panel');
  const editFields = document.querySelectorAll('.admin-form > .form-group, .admin-form > .form-row, .admin-form > .sub-items-section');
  
  btnShowEditor.classList.add('active');
  btnShowPreview.classList.remove('active');
  previewPanel.style.display = 'none';
  editFields.forEach(el => {
    if (el.id === 'code-group' && !config.hasCode) return;
    el.style.display = 'flex';
  });

  // 顯示編輯區
  document.getElementById('no-selection-view').style.display = 'none';
  document.getElementById('edit-form').style.display = 'flex';

  // 渲染子項目
  renderSubSections();
}

// 7. 渲染子項目區塊 (根據 JSON 格式動態生成結構表單)
function renderSubSections() {
  const container = document.getElementById('sub-items-container');
  container.innerHTML = '';

  const config = SCHEMA_CONFIGS[currentDataSource];
  const item = fileData[selectedIndex];
  
  // 生成多個子分類（例如 steps 和 faq）
  config.subSections.forEach(section => {
    // 取得該主題對應的子陣列，若不存在則初始化
    if (!item[section.key]) {
      item[section.key] = [];
    }
    
    const sectionWrapper = document.createElement('div');
    sectionWrapper.className = 'sub-section-group';
    sectionWrapper.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin:16px 0 10px; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom:6px;">
        <h5 style="color: var(--accent-1); margin:0;">${section.title}</h5>
        <button type="button" class="action-btn-sm" onclick="window.adminAddSubItem('${section.key}')">+ 新增</button>
      </div>
      <div id="list-${section.key}" class="sub-list-container"></div>
    `;
    
    container.appendChild(sectionWrapper);
    renderSubList(section.key);
  });
}

// 渲染特定類別的子列表
function renderSubList(sectionKey) {
  const subContainer = document.getElementById(`list-${sectionKey}`);
  subContainer.innerHTML = '';

  const config = SCHEMA_CONFIGS[currentDataSource];
  const sectionDef = config.subSections.find(s => s.key === sectionKey);
  const items = fileData[selectedIndex][sectionKey];

  if (items.length === 0) {
    subContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem; padding:10px;">目前尚無項目</p>';
    return;
  }

  items.forEach((subItem, index) => {
    const card = document.createElement('div');
    card.className = 'sub-item-card';
    card.setAttribute('data-index', index);

    // 控制按鈕
    let controlsHtml = `
      <div class="sub-item-controls">
        <button type="button" class="action-btn-sm" onclick="window.adminMoveSubItem('${sectionKey}', ${index}, -1)" title="上移">▲</button>
        <button type="button" class="action-btn-sm" onclick="window.adminMoveSubItem('${sectionKey}', ${index}, 1)" title="下移">▼</button>
        <button type="button" class="action-btn-sm" style="color:#ef4444; border-color:rgba(239,68,68,0.2);" onclick="window.adminDeleteSubItem('${sectionKey}', ${index})" title="刪除">&times;</button>
      </div>
    `;

    // 依配置定義動態產生 input 欄位
    let fieldsHtml = '';
    sectionDef.fields.forEach(field => {
      const val = subItem[field.name] || '';
      if (field.type === 'textarea') {
        fieldsHtml += `
          <div class="form-group">
            <label class="field-label">${field.label}</label>
            <textarea class="admin-textarea" oninput="window.adminUpdateSubField('${sectionKey}', ${index}, '${field.name}', this.value)">${val}</textarea>
          </div>
        `;
      } else {
        fieldsHtml += `
          <div class="form-group">
            <label class="field-label">${field.label}</label>
            <input type="text" class="admin-input" value="${val}" oninput="window.adminUpdateSubField('${sectionKey}', ${index}, '${field.name}', this.value)">
          </div>
        `;
      }
    });

    card.innerHTML = `
      <div class="sub-item-header">
        <span class="sub-item-index">#${index + 1}</span>
        ${controlsHtml}
      </div>
      <div style="display:flex; flex-direction:column; gap:10px;">
        ${fieldsHtml}
      </div>
    `;

    subContainer.appendChild(card);
  });
}

// 8. 表單與記憶體同步
function syncFormToMemory() {
  if (selectedIndex === -1) return;
  
  const config = SCHEMA_CONFIGS[currentDataSource];
  const item = fileData[selectedIndex];

  item[config.idField] = document.getElementById('topic-id').value.trim();
  item.englishTitle = document.getElementById('topic-english').value.trim();
  item.title = document.getElementById('topic-title').value.trim();
  item.description = document.getElementById('topic-desc').value.trim();

  if (config.hasCode) {
    item.code = document.getElementById('topic-code').value;
  }
}

// 9. 更新未儲存狀態標示
function updateSyncStatus(modified) {
  isModified = modified;
  const indicator = document.getElementById('sync-status-indicator');
  if (modified) {
    indicator.className = 'sync-status unsaved';
    indicator.innerHTML = '● 本地有未發佈的修改';
  } else {
    indicator.className = 'sync-status saved';
    indicator.innerHTML = '● 與檔案同步中';
  }
}

// 10. 管理操作方法：新增、刪除、移動子項目（掛載至 window 供 inline HTML onclick 使用）
window.adminUpdateSubField = (sectionKey, index, fieldName, value) => {
  fileData[selectedIndex][sectionKey][index][fieldName] = value;
  updateSyncStatus(true);
};

window.adminAddSubItem = (sectionKey) => {
  const config = SCHEMA_CONFIGS[currentDataSource];
  const sectionDef = config.subSections.find(s => s.key === sectionKey);
  
  // 建立預設空物件
  const newObj = {};
  sectionDef.fields.forEach(f => {
    newObj[f.name] = '';
  });

  fileData[selectedIndex][sectionKey].push(newObj);
  updateSyncStatus(true);
  renderSubList(sectionKey);
};

window.adminDeleteSubItem = (sectionKey, index) => {
  if (!confirm('確定要刪除此子項目嗎？')) return;
  fileData[selectedIndex][sectionKey].splice(index, 1);
  updateSyncStatus(true);
  renderSubList(sectionKey);
};

window.adminMoveSubItem = (sectionKey, index, direction) => {
  const arr = fileData[selectedIndex][sectionKey];
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= arr.length) return;

  // 交換位置
  const temp = arr[index];
  arr[index] = arr[targetIndex];
  arr[targetIndex] = temp;

  updateSyncStatus(true);
  renderSubList(sectionKey);
};

// 11. 新增、刪除頂級主題
function addNewTopic() {
  const config = SCHEMA_CONFIGS[currentDataSource];
  const idKey = config.idField;
  
  const newTopic = {
    title: '新增主題名稱',
    englishTitle: 'New Topic Title',
    description: '請輸入此主題的介紹與描述。'
  };
  newTopic[idKey] = 'new-topic-' + Date.now().toString().slice(-4);

  // 初始化空的子項陣列
  config.subSections.forEach(sec => {
    newTopic[sec.key] = [];
  });

  if (config.hasCode) {
    newTopic.code = '';
  }

  fileData.push(newTopic);
  selectedIndex = fileData.length - 1;
  isModified = true;
  updateSyncStatus(true);
  
  renderTopicList();
  selectTopic(selectedIndex);
}

function deleteTopic() {
  if (selectedIndex === -1) return;
  if (!confirm(`確定要刪除主題「${fileData[selectedIndex].title}」嗎？此動作不可逆！`)) return;

  fileData.splice(selectedIndex, 1);
  selectedIndex = -1;
  isModified = true;
  updateSyncStatus(true);
  
  renderTopicList();
  document.getElementById('edit-form').style.display = 'none';
  document.getElementById('no-selection-view').style.display = 'flex';
}

// 12. 預覽渲染邏輯 (模擬現有前端渲染，調用 KaTeX/Prism.js)
function renderPreview() {
  const panel = document.getElementById('preview-panel');
  if (selectedIndex === -1) return;

  const item = fileData[selectedIndex];
  const config = SCHEMA_CONFIGS[currentDataSource];

  let html = `
    <h2 class="preview-title" style="margin-bottom:8px; border-bottom: 2px solid var(--accent-1); padding-bottom:8px;">${item.title || ''}</h2>
    <h4 style="color:var(--text-muted); margin-bottom:16px;">${item.englishTitle || ''}</h4>
    <p style="line-height:1.7; margin-bottom:24px; white-space: pre-wrap;">${item.description || ''}</p>
  `;

  // 渲染 AI 步驟與公式
  if (currentDataSource === 'ai-notes.json' || currentDataSource === 'network-notes.json') {
    if (item.steps && item.steps.length > 0) {
      html += `<h3 style="color:var(--accent-2); margin:20px 0 10px;">學習步驟</h3>`;
      item.steps.forEach(step => {
        html += `
          <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:8px; padding:16px; margin-bottom:12px;">
            <h5 style="margin-bottom:8px; color:var(--accent-1);">${step.name || ''}</h5>
            ${step.summary ? `<p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:6px;">${step.summary}</p>` : ''}
            <p style="font-size:0.95rem; line-height:1.6;">${step.details || ''}</p>
          </div>
        `;
      });
    }

    if (item.formulas && item.formulas.length > 0) {
      html += `<h3 style="color:var(--accent-2); margin:20px 0 10px;">關鍵數學公式</h3>`;
      item.formulas.forEach(form => {
        html += `
          <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:8px; padding:16px; margin-bottom:12px;">
            <h5 style="margin-bottom:8px; color:var(--accent-1);">${form.name || ''}</h5>
            <div style="padding:12px; background:rgba(0,0,0,0.2); border-radius:4px; text-align:center; margin-bottom:8px; overflow-x:auto;">
              ${form.latex || ''}
            </div>
            <p style="font-size:0.9rem; color:var(--text-muted);">${form.description || ''}</p>
          </div>
        `;
      });
    }
  }

  // 渲染硬體規格與指南
  if (currentDataSource === 'hardware-notes.json' || currentDataSource === 'test-notes.json') {
    if (item.specs && item.specs.length > 0) {
      html += `<h3 style="color:var(--accent-2); margin:20px 0 10px;">硬體核心規格</h3>`;
      item.specs.forEach(spec => {
        html += `
          <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:8px; padding:16px; margin-bottom:12px;">
            <h5 style="margin-bottom:4px; color:var(--accent-1);">${spec.name || ''} - <span style="color:#fff;">${spec.value || ''}</span></h5>
            <p style="font-size:0.9rem; color:var(--text-muted);">${spec.description || ''}</p>
          </div>
        `;
      });
    }

    if (item.guides && item.guides.length > 0) {
      html += `<h3 style="color:var(--accent-2); margin:20px 0 10px;">硬體評估與建議</h3>`;
      item.guides.forEach(guide => {
        html += `
          <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:8px; padding:16px; margin-bottom:12px;">
            <h5 style="margin-bottom:8px; color:var(--accent-1);">${guide.card || ''} (${guide.recommendation || ''})</h5>
            <p style="font-size:0.9rem; margin-bottom:4px;"><strong style="color:var(--accent-2);">優點:</strong> ${guide.pros || ''}</p>
            <p style="font-size:0.9rem;"><strong style="color:#ef4444;">缺點:</strong> ${guide.cons || ''}</p>
          </div>
        `;
      });
    }
  }

  // 渲染指令清單
  if (currentDataSource === 'commands-notes.json') {
    if (item.commands && item.commands.length > 0) {
      html += `<h3 style="color:var(--accent-2); margin:20px 0 10px;">命令清單</h3>`;
      item.commands.forEach(cmd => {
        html += `
          <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:8px; padding:16px; margin-bottom:12px;">
            <h5 style="margin-bottom:4px; color:var(--accent-1);">${cmd.desc || ''}</h5>
            <code style="display:block; padding:8px 12px; background:#000; border-radius:4px; margin-bottom:8px; font-family:var(--font-mono); font-size:0.9rem; color:var(--accent-2);">${cmd.cmd || ''}</code>
            <p style="font-size:0.9rem; color:var(--text-muted);">${cmd.explanation || ''}</p>
          </div>
        `;
      });
    }
  }

  // 渲染 FAQ
  if (item.faq && item.faq.length > 0) {
    html += `<h3 style="color:var(--accent-2); margin:20px 0 10px;">❓ 常見問答</h3>`;
    item.faq.forEach(q => {
      html += `
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-color); border-radius:8px; padding:16px; margin-bottom:12px;">
          <h5 style="margin-bottom:6px; color:#f59e0b;">問: ${q.question || ''}</h5>
          <p style="font-size:0.95rem; line-height:1.6; color:var(--text-main);">答: ${q.answer || ''}</p>
        </div>
      `;
    });
  }

  // 渲染 Code Block
  if (config.hasCode && item.code) {
    html += `
      <h3 style="color:var(--accent-2); margin:20px 0 10px;">💻 Python 示範程式碼</h3>
      <pre style="border-radius:8px;"><code class="language-python">${escapeHtml(item.code)}</code></pre>
    `;
  }

  panel.innerHTML = html;

  // 觸發公式與程式碼高亮渲染
  setTimeout(() => {
    if (window.renderMathInElement) {
      window.renderMathInElement(panel, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    }
    if (window.Prism) {
      window.Prism.highlightAllUnder(panel);
    }
  }, 50);
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 13. 本地備份 JSON 下載
function downloadJsonBackup() {
  syncFormToMemory();
  const jsonStr = JSON.stringify(fileData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = currentDataSource;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  isModified = false;
  updateSyncStatus(false);
}

// 14. 儲存庫憑證 (Token) 存取管理
function saveCredentials() {
  const owner = document.getElementById('github-owner').value.trim();
  const repo = document.getElementById('github-repo').value.trim();
  const branch = document.getElementById('github-branch').value.trim();
  const token = document.getElementById('github-token').value.trim();

  const creds = { owner, repo, branch, token };
  localStorage.setItem('github_creds', JSON.stringify(creds));
  alert('憑證已成功儲存在本機！');
}

function loadCredentials() {
  const credsStr = localStorage.getItem('github_creds');
  if (credsStr) {
    try {
      const creds = JSON.parse(credsStr);
      document.getElementById('github-owner').value = creds.owner || 'zongyandeng';
      document.getElementById('github-repo').value = creds.repo || 'My_web';
      document.getElementById('github-branch').value = creds.branch || 'main';
      document.getElementById('github-token').value = creds.token || '';
    } catch (e) {
      console.error('解析本機儲存庫憑證失敗:', e);
    }
  }
}

// 15. 發佈修改至 GitHub (呼叫 REST API)
async function publishToGitHub() {
  syncFormToMemory();
  
  // 讀取 Token 設定
  const credsStr = localStorage.getItem('github_creds');
  if (!credsStr) {
    alert('請先點擊右上角「設定 GitHub Token」設定您的發佈憑證！');
    document.getElementById('token-modal').style.display = 'flex';
    return;
  }

  let creds;
  try {
    creds = JSON.parse(credsStr);
  } catch (e) {
    alert('本機憑證格式錯誤，請重新設定。');
    return;
  }

  const { owner, repo, branch, token } = creds;
  if (!owner || !repo || !branch || !token) {
    alert('請確認憑證資訊填寫完整！');
    document.getElementById('token-modal').style.display = 'flex';
    return;
  }

  const indicator = document.getElementById('sync-status-indicator');
  const publishBtn = document.getElementById('publish-github-btn');
  
  // UI 鎖定
  indicator.className = 'sync-status syncing';
  indicator.innerHTML = '● 正在呼叫 GitHub API...';
  publishBtn.disabled = true;
  publishBtn.textContent = '發佈中...';

  const filePath = `src/data/${currentDataSource}`;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

  try {
    // Step 1: 取得遠端目標檔案的最新 SHA 碼
    const getRes = await fetch(`${apiUrl}?ref=${branch}&t=${Date.now()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    let sha = null;
    if (getRes.status === 200) {
      const fileInfo = await getRes.json();
      sha = fileInfo.sha;
    } else if (getRes.status === 404) {
      // 檔案不存在，這意味著要新建（例如 test-notes.json）
      console.log('檔案不存在，將進行新建。');
    } else {
      throw new Error(`無法取得檔案資訊 (Status: ${getRes.status})`);
    }

    // Step 2: 格式化 JSON 並做 UTF-8 安全的 Base64 編碼，防止中文亂碼
    const jsonString = JSON.stringify(fileData, null, 2);
    const base64Content = btoa(unescape(encodeURIComponent(jsonString)));

    // Step 3: 發送 PUT 請求寫入檔案
    const bodyObj = {
      message: `docs(admin): update ${currentDataSource} via Web Editor`,
      content: base64Content,
      branch: branch
    };
    if (sha) {
      bodyObj.sha = sha;
    }

    const putRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json'
      },
      body: JSON.stringify(bodyObj)
    });

    if (!putRes.ok) {
      const errInfo = await putRes.json();
      throw new Error(errInfo.message || 'PUT 檔案失敗');
    }

    // 發佈成功
    alert(`發佈成功！\n已將修改發佈至 GitHub。GitHub Actions 會自動編譯並部署，約 1~2 分鐘後您的網站內容將同步更新。`);
    isModified = false;
    updateSyncStatus(false);
  } catch (err) {
    console.error('發佈失敗:', err);
    if (err.message === 'Failed to fetch') {
      alert(`發佈失敗：Failed to fetch。\n\n這通常是由以下原因引起：\n1. 您的瀏覽器安裝了阻擋廣告/追蹤的插件（如 AdBlock、Privacy Badger、Brave 瀏覽器內建防護），這些插件會攔截往 api.github.com 的 API 請求。請嘗試在該頁面暫時停用此類插件。\n2. 您的網路連線中斷或無法連接 GitHub API。\n3. 請按下鍵盤 F12 打開「開發者工具」，切換至 Console (控制台) 分頁以查看瀏覽器拋出的詳細錯誤。`);
    } else {
      alert(`發佈失敗，請檢查錯誤：\n${err.message}`);
    }
    updateSyncStatus(true);
  } finally {
    // 釋放 UI
    publishBtn.disabled = false;
    publishBtn.textContent = '🚀 發佈到 GitHub';
  }
}
