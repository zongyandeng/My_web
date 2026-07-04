import MiniSearch from 'https://cdn.jsdelivr.net/npm/minisearch@7.1.1/dist/es/index.js';

// --- RAG 助理設定面板 ---
const CONFIG = {
  // 是否啟用 AI 生成式對話 RAG (若為 false 則僅執行純前端檢索跳轉引導)
  useGeminiRAG: false,
  // 部署後的 Cloudflare Worker 網址 (請在階段三部署完畢後修改此處)
  workerUrl: '',
};

// 預置個人簡介資料 (對應 profile.html)
const PROFILE_DATA = [
  {
    id: 'profile_intro',
    title: '關於 Edison / 個人簡介',
    content: 'Edison 是大學資訊工程學系的學生，主要研究人工智慧與資料科學。熱衷於大語言模型微調 (Fine-tuning) 與檢索增強生成 (RAG) 專題研究。',
    category: '個人經歷',
    url: 'profile.html'
  },
  {
    id: 'profile_award_rag',
    title: '全國大專院校 AI 應用創新競賽 - 特優 (2026年5月)',
    content: 'Edison 與實驗室夥伴共同開發了基於 RAG 技術的「校園私有知識庫問答機器人」，實作了語意切分 (Semantic Chunking) 與向量重排 (Rerank)，使模型問答準確度提升了 35%，並榮獲全國特優。',
    category: '個人經歷',
    url: 'profile.html'
  },
  {
    id: 'profile_lab',
    title: '加入人工智慧與資料科學實驗室 (2025年11月)',
    content: 'Edison 正式加入 AI 實驗室，開啟「大語言模型微調與檢索增強生成 (RAG)」專題。學習 GPU 伺服器訓練、評估混淆矩陣與解讀 Loss 曲線圖。',
    category: '個人經歷',
    url: 'profile.html'
  },
  {
    id: 'profile_award_algo',
    title: '全國程式設計大賽 - 優等 (2025年9月)',
    content: 'Edison 參加全國性演算法競賽，解決了動態規劃 (Dynamic Programming)、圖論與字串處理的演算法難題，獲得優等名次。',
    category: '個人經歷',
    url: 'profile.html'
  }
];

let miniSearch;
const allDocuments = [];

// --- 載入與初始化資料庫 ---
async function initKnowledgeBase() {
  // 1. 初始化 MiniSearch
  miniSearch = new MiniSearch({
    fields: ['title', 'content', 'category'], // 搜尋權重欄位
    storeFields: ['title', 'content', 'category', 'url'], // 搜尋結果返回的資訊
    searchOptions: {
      boost: { title: 2, category: 1 }, // 提高標題與類別的權重
      prefix: true,
      fuzzy: 0.2
    }
  });

  // 2. 加入預置的個人經歷資料
  allDocuments.push(...PROFILE_DATA);

  // 3. 非同步載入其餘 JSON 檔案
  try {
    const [aiRes, cmdRes, hwRes] = await Promise.allSettled([
      fetch('src/data/ai-notes.json').then(r => r.json()),
      fetch('src/data/commands-notes.json').then(r => r.json()),
      fetch('src/data/hardware-notes.json').then(r => r.json())
    ]);

    // 處理 AI 筆記資料 (ai-notes.json)
    if (aiRes.status === 'fulfilled') {
      aiRes.value.forEach((note, noteIdx) => {
        note.steps.forEach((step, stepIdx) => {
          allDocuments.push({
            id: `ai_note_${note.id}_step_${stepIdx}`,
            title: `${note.title} - ${step.name}`,
            content: `${step.details}`,
            category: 'AI 實驗室',
            url: `ai-learning.html?note=${note.id}`
          });
        });
      });
    }

    // 處理指令資料 (commands-notes.json)
    if (cmdRes.status === 'fulfilled') {
      cmdRes.value.forEach((cat, catIdx) => {
        cat.commands.forEach((cmd, cmdIdx) => {
          allDocuments.push({
            id: `command_${cat.category}_${cmdIdx}`,
            title: `${cat.title} - ${cmd.desc}`,
            content: `指令: \`${cmd.cmd}\`。 物理意義與說明: ${cmd.explanation}`,
            category: '開發指令查詢',
            url: `commands.html?cat=${cat.category}`
          });
        });
      });
    }

    // 處理硬體資料 (hardware-notes.json)
    if (hwRes.status === 'fulfilled') {
      hwRes.value.forEach((hw, hwIdx) => {
        // specs
        if (hw.specs) {
          hw.specs.forEach((spec, specIdx) => {
            allDocuments.push({
              id: `hw_spec_${hw.id}_${specIdx}`,
              title: `${hw.title} - ${spec.name}`,
              content: `${spec.value}。物理意義與功能: ${spec.description}`,
              category: '硬體研究室',
              url: `hardware.html?id=${hw.id}`
            });
          });
        }
        // guides
        if (hw.guides) {
          hw.guides.forEach((guide, gIdx) => {
            allDocuments.push({
              id: `hw_guide_${hw.id}_${gIdx}`,
              title: `${hw.title} - 推薦顯示卡 ${guide.card}`,
              content: `定位: ${guide.recommendation}。 優點: ${guide.pros}。 缺點: ${guide.cons}`,
              category: '硬體研究室',
              url: `hardware.html?id=${hw.id}`
            });
          });
        }
        // faq
        if (hw.faq) {
          hw.faq.forEach((faq, fIdx) => {
            allDocuments.push({
              id: `hw_faq_${hw.id}_${fIdx}`,
              title: `${hw.title} - FAQ 常見問題`,
              content: `${faq.question} ${faq.answer}`,
              category: '硬體研究室',
              url: `hardware.html?id=${hw.id}`
            });
          });
        }
      });
    }

    // 4. 將打平後的全部文件加入 MiniSearch 索引中
    miniSearch.addAll(allDocuments);
    console.log(`[RAG助理] 知識庫載入成功！共載入 ${allDocuments.length} 筆索引。`);

  } catch (error) {
    console.error('[RAG助理] 載入知識庫發生錯誤:', error);
  }
}

// --- 動態注入 Chat UI 元素 ---
function injectChatUI() {
  // 載入助理 CSS
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'src/assistant.css';
  document.head.appendChild(link);

  // 1. 懸浮觸發按鈕
  const trigger = document.createElement('button');
  trigger.id = 'assistant-trigger';
  trigger.className = 'assistant-trigger';
  trigger.innerHTML = '🪐';
  trigger.setAttribute('aria-label', '打開 AI 助理');
  document.body.appendChild(trigger);

  // 2. 對話主視窗
  const chatbox = document.createElement('div');
  chatbox.id = 'assistant-chatbox';
  chatbox.className = 'assistant-chatbox';
  chatbox.innerHTML = `
    <div class="assistant-chat-header">
      <div class="title">🪐 <span>星際助理 (RAG Beta)</span></div>
      <button class="close-btn" id="assistant-close" aria-label="關閉對話框">✕</button>
    </div>
    <div class="assistant-chat-body" id="assistant-chat-body">
      <div class="chat-msg bot">
        你好！我是這個網頁的專屬助理。想找什麼學習資料或指令嗎？<br>
        例如輸入：<b>「Git 如何還原」</b>、<b>「Edison 拿過什麼獎」</b> 或 <b>「GPU 顯存推薦」</b>，我來為您指引！
      </div>
    </div>
    <div class="assistant-chat-input-area">
      <input type="text" id="assistant-input" class="assistant-assistant-input assistant-chat-input" placeholder="問點什麼吧..." autocomplete="off">
      <button id="assistant-send" class="assistant-chat-send" aria-label="發送訊息">➔</button>
    </div>
  `;
  document.body.appendChild(chatbox);

  // 3. 事件綁定
  const closeBtn = document.getElementById('assistant-close');
  const sendBtn = document.getElementById('assistant-send');
  const inputField = document.getElementById('assistant-input');

  trigger.addEventListener('click', () => {
    chatbox.classList.toggle('open');
    if (chatbox.classList.contains('open')) {
      inputField.focus();
    }
  });

  closeBtn.addEventListener('click', () => {
    chatbox.classList.remove('open');
  });

  sendBtn.addEventListener('click', handleUserSendMessage);
  inputField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      handleUserSendMessage();
    }
  });
}

// 渲染單條訊息泡泡
function appendMessage(text, sender, isLoading = false) {
  const body = document.getElementById('assistant-chat-body');
  if (!body) return null;

  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg ${sender}`;
  
  if (isLoading) {
    msgDiv.classList.add('loading');
    msgDiv.innerHTML = `<span></span><span></span><span></span>`;
  } else {
    // 支援換行與保留基本 HTML
    msgDiv.innerHTML = text.replace(/\n/g, '<br>');
  }

  body.appendChild(msgDiv);
  body.scrollTop = body.scrollHeight;
  return msgDiv;
}

// 移除 Loading 氣泡
function removeLoading(loadingDiv) {
  if (loadingDiv && loadingDiv.parentNode) {
    loadingDiv.parentNode.removeChild(loadingDiv);
  }
}

// --- 處理使用者送出訊息 ---
async function handleUserSendMessage() {
  const inputField = document.getElementById('assistant-input');
  if (!inputField) return;

  const question = inputField.value.trim();
  if (!question) return;

  // 1. 顯示使用者訊息
  appendMessage(question, 'user');
  inputField.value = '';

  // 2. 顯示 Loading
  const loadingBubble = appendMessage('', 'bot', true);

  // 3. 執行檢索 (Retrieval)
  let searchResults = [];
  if (miniSearch) {
    searchResults = miniSearch.search(question);
  }

  // 4. 分流處理：純前端檢索 vs AI RAG 對話
  if (!CONFIG.useGeminiRAG) {
    // 方案一：純前端檢索跳轉
    setTimeout(() => {
      removeLoading(loadingBubble);
      handleLocalSearchFlow(searchResults);
    }, 600); // 模擬短暫延遲，體驗較流暢
  } else {
    // 方案二：Cloudflare Workers + Gemini API
    await handleAIRAGFlow(question, searchResults, loadingBubble);
  }
}

// --- 處理純前端檢索與單元跳轉 (方案一) ---
function handleLocalSearchFlow(results) {
  const relevantResults = results.slice(0, 3); // 取前三筆

  if (relevantResults.length === 0) {
    appendMessage('很抱歉，在目前網頁中找不到相關資料。您可以換個關鍵字試試看！', 'bot');
    return;
  }

  appendMessage('為您檢索到以下相關單元，點擊即可前往查詢：', 'bot');
  
  // 生成引導卡片容器
  const body = document.getElementById('assistant-chat-body');
  const cardContainer = document.createElement('div');
  cardContainer.className = 'jump-cards-container';

  relevantResults.forEach(r => {
    // 找出原始 document 資料
    const doc = allDocuments.find(d => d.id === r.id);
    if (!doc) return;

    // 建立卡片連結
    const card = document.createElement('a');
    card.className = 'jump-card';
    card.href = doc.url;
    card.innerHTML = `
      <div class="jump-card-info">
        <span class="jump-card-title">${doc.title}</span>
        <span class="jump-card-desc">${doc.content.substring(0, 45)}...</span>
      </div>
      <span class="jump-card-badge">${doc.category}</span>
    `;

    // 點擊卡片跳轉時關閉對話框
    card.addEventListener('click', () => {
      document.getElementById('assistant-chatbox').classList.remove('open');
    });

    cardContainer.appendChild(card);
  });

  body.appendChild(cardContainer);
  body.scrollTop = body.scrollHeight;
}

// --- 處理 Cloudflare Workers + Gemini API 串接流 (方案二) ---
async function handleAIRAGFlow(question, searchResults, loadingBubble) {
  // 1. 檢查 Worker URL 是否配置
  if (!CONFIG.workerUrl) {
    removeLoading(loadingBubble);
    appendMessage('偵測到您啟用了 Gemini RAG 模式，但尚未配置 `CONFIG.workerUrl`。請在 `src/assistant.js` 中填入您部署的 Cloudflare Worker 網址。', 'bot');
    return;
  }

  // 2. 準備上下文 (Context)
  // 取前三筆檢索結果作為上下文，限制總長度
  const relevantResults = searchResults.slice(0, 3);
  let contextText = '';
  
  if (relevantResults.length > 0) {
    contextText = relevantResults.map((r, idx) => {
      const doc = allDocuments.find(d => d.id === r.id);
      if (!doc) return '';
      return `【資料來源 ${idx + 1} - 單元: ${doc.category}】\n標題: ${doc.title}\n內容: ${doc.content}\n網址: ${doc.url}`;
    }).join('\n\n');
  }

  // 3. 發送 API 請求給 Cloudflare Worker (支援 Stream 串流輸出)
  try {
    const response = await fetch(CONFIG.workerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        question: question,
        context: contextText
      })
    });

    removeLoading(loadingBubble);

    if (!response.ok) {
      const errText = await response.text();
      appendMessage(`呼叫 AI 助理失敗 (${response.status}): ${errText}`, 'bot');
      return;
    }

    // 準備一個空的 bot 訊息氣泡用來動態寫入串流內容
    const botMsgBubble = appendMessage('', 'bot');
    
    // 讀取 Stream 數據
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let accumulatedText = '';

    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        const chunk = decoder.decode(value, { stream: true });
        accumulatedText += chunk;
        
        // 即時渲染 Markdown 到 HTML 轉譯 (這裡做簡單的粗體與換行替換)
        let formattedText = accumulatedText
          .replace(/\n/g, '<br>')
          .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') // 支持 **bold** 粗體
          .replace(/\*(.*?)\*/g, '<i>$1</i>')   // 支持 *italic* 斜體
          .replace(/`(.*?)`/g, '<code style="background:rgba(255,255,255,0.1);padding:2px 4px;border-radius:4px;font-family:var(--font-mono);">$1</code>'); // 支持 `code`
        
        botMsgBubble.innerHTML = formattedText;
        
        // 保持置底
        const body = document.getElementById('assistant-chat-body');
        body.scrollTop = body.scrollHeight;
      }
    }

    // AI 回答完畢後，如果我們有相關的實體跳轉連結，可以在下方額外帶出跳轉卡片，提升 UX！
    if (relevantResults.length > 0 && !accumulatedText.includes('找不到相關資料') && !accumulatedText.includes('找不到資料')) {
      showMiniJumpLinks(relevantResults);
    }

  } catch (error) {
    removeLoading(loadingBubble);
    console.error('[RAG助理] 串接 AI 時發生異常:', error);
    appendMessage('抱歉，與 AI 助理連線時發生錯誤。請確認您的網路連線或 Cloudflare Worker 狀態。', 'bot');
  }
}

// 在 AI 答覆完後額外顯示推薦跳轉小卡片
function showMiniJumpLinks(results) {
  const body = document.getElementById('assistant-chat-body');
  
  const hintText = document.createElement('div');
  hintText.style.fontSize = '0.75rem';
  hintText.style.color = 'var(--text-muted)';
  hintText.style.marginTop = '10px';
  hintText.style.paddingLeft = '5px';
  hintText.textContent = '📍 推薦相關跳轉單元：';
  body.appendChild(hintText);

  const cardContainer = document.createElement('div');
  cardContainer.className = 'jump-cards-container';
  cardContainer.style.marginTop = '4px';

  results.forEach(r => {
    const doc = allDocuments.find(d => d.id === r.id);
    if (!doc) return;

    const card = document.createElement('a');
    card.className = 'jump-card';
    card.href = doc.url;
    card.style.padding = '8px 12px'; // 比主卡片小一點
    card.innerHTML = `
      <div class="jump-card-info">
        <span class="jump-card-title" style="font-size:0.8rem;">${doc.title}</span>
      </div>
      <span class="jump-card-badge" style="font-size:0.65rem;">${doc.category}</span>
    `;

    card.addEventListener('click', () => {
      document.getElementById('assistant-chatbox').classList.remove('open');
    });

    cardContainer.appendChild(card);
  });

  body.appendChild(cardContainer);
  body.scrollTop = body.scrollHeight;
}

// --- 初始化執行 ---
document.addEventListener('DOMContentLoaded', () => {
  injectChatUI();
  initKnowledgeBase();
});
