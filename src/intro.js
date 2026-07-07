/**
 * Edison.Dev - 全域進入動畫控制器 (Intro Animations Controller)
 * 支援 4 種科技感與宇宙深空主題的進入動畫：
 * 1. space-warp (星流躍遷 Canvas 動畫)
 * 2. system-boot (模擬終端開機文字動畫)
 * 3. neural-network (AI 神經網路 Canvas 動畫)
 * 4. supernova (引力坍縮超新星大爆炸 Canvas 動畫)
 */

// 獲取當前 CSS 主題顏色 (適配 Deep Space / Cyberpunk)
function getIntroThemeColors() {
  const isCyber = document.documentElement.getAttribute('data-theme') === 'cyberpunk';
  if (isCyber) {
    return {
      bg: '#0f0913',
      accent1: '#f43f5e', // 桃紅
      accent2: '#10b981', // 綠色
      text: '#05ffc0',
      glow: 'rgba(244, 63, 94, 0.4)'
    };
  } else {
    return {
      bg: '#05070f',
      accent1: '#3b82f6', // 藍色
      accent2: '#a855f7', // 紫色
      text: '#60a5fa',
      glow: 'rgba(59, 130, 246, 0.4)'
    };
  }
}

class IntroController {
  constructor() {
    this.animationType = localStorage.getItem('intro-animation') || 'space-warp';
    this.playedKey = 'intro-played';
    this.overlay = null;
    this.canvas = null;
    this.ctx = null;
    this.animationId = null;
    this.startTime = null;
    this.colors = getIntroThemeColors();

    // 檢查是否為預覽模式 (URL 包含 #preview-intro)
    this.isPreviewMode = window.location.hash === '#preview-intro';
  }

  init() {
    // 1. 如果設定為「無動畫」，或是本次會話 (Session) 已經播放過且非預覽模式，則直接跳過
    const hasPlayed = sessionStorage.getItem(this.playedKey) === 'true';
    if (this.animationType === 'none' && !this.isPreviewMode) {
      return;
    }
    if (hasPlayed && !this.isPreviewMode) {
      return;
    }

    // 2. 建立 Overlay 遮罩層
    this.createOverlay();

    // 3. 根據設定播放動畫
    if (this.animationType === 'space-warp') {
      this.playSpaceWarp();
    } else if (this.animationType === 'system-boot') {
      this.playSystemBoot();
    } else if (this.animationType === 'neural-network') {
      this.playNeuralNetwork();
    } else if (this.animationType === 'supernova') {
      this.playSupernova();
    } else {
      // 若為 none 但在預覽模式下
      this.finish(500);
    }

    // 4. 標記已播放 (非預覽模式下)
    if (!this.isPreviewMode) {
      sessionStorage.setItem(this.playedKey, 'true');
    }
  }

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'intro-overlay';
    
    // 設定 Overlay 基礎樣式 (確保在 style.css 載入前就立即可用，防止閃爍)
    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      backgroundColor: this.colors.bg,
      zIndex: '999999',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      transition: 'opacity 0.6s cubic-bezier(0.25, 1, 0.5, 1), transform 0.6s cubic-bezier(0.25, 1, 0.5, 1)'
    });

    document.body.appendChild(this.overlay);
  }

  setupCanvas() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    Object.assign(this.canvas.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none'
    });
    this.overlay.appendChild(this.canvas);
    
    this.resizeCanvas();
    window.addEventListener('resize', this.resizeHandler = () => this.resizeCanvas());
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.scale(dpr, dpr);
  }

  // ==========================================
  // 1. 星流躍遷 (Space Warp)
  // ==========================================
  playSpaceWarp() {
    this.setupCanvas();
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // 初始化 3D 空間粒子
    const numStars = 220;
    const stars = [];
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: (Math.random() - 0.5) * width * 2,
        y: (Math.random() - 0.5) * height * 2,
        z: Math.random() * 1000,
        px: 0,
        py: 0
      });
    }

    // 建立中央標題文字容器
    const titleEl = this.createCenteredTitle('🌌 EDISON.DEV');
    
    let speed = 7;
    
    const animate = (timestamp) => {
      if (!this.startTime) this.startTime = timestamp;
      const elapsed = timestamp - this.startTime;
      
      this.ctx.fillStyle = 'rgba(5, 7, 15, 0.18)'; // 拖尾尾跡
      this.ctx.fillRect(0, 0, width, height);
      
      const cx = width / 2;
      const cy = height / 2;
      
      // 在 1.2 秒後開始大幅加速
      if (elapsed > 1200) {
        speed += 0.8;
        titleEl.style.opacity = Math.min((elapsed - 1200) / 600, 1);
        titleEl.style.transform = `scale(${1 + (elapsed - 1200) * 0.0003})`;
      }
      
      stars.forEach(star => {
        // 投影舊位置
        const kx = (star.x / star.z) * width + cx;
        const ky = (star.y / star.z) * height + cy;
        
        star.z -= speed;
        
        // 投影新位置
        const nx = (star.x / star.z) * width + cx;
        const ny = (star.y / star.z) * height + cy;
        
        if (star.z <= 0 || nx < 0 || nx > width || ny < 0 || ny > height) {
          // 重新生成在遠處
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
          star.z = 1000;
          star.px = nx;
          star.py = ny;
        } else {
          // 繪製拉長的光線
          if (star.px !== 0 && star.py !== 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(star.px, star.py);
            this.ctx.lineTo(nx, ny);
            this.ctx.lineWidth = Math.min(1.5, (1000 - star.z) / 400 + 0.2);
            
            const gradient = this.ctx.createLinearGradient(star.px, star.py, nx, ny);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(0.5, this.colors.accent1);
            gradient.addColorStop(1, this.colors.accent2);
            
            this.ctx.strokeStyle = gradient;
            this.ctx.stroke();
          }
          star.px = nx;
          star.py = ny;
        }
      });
      
      if (elapsed < 2400) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.finish(600);
      }
    };
    
    this.animationId = requestAnimationFrame(animate);
  }

  // ==========================================
  // 2. 模擬終端開機 (System Boot)
  // ==========================================
  playSystemBoot() {
    const termContainer = document.createElement('div');
    termContainer.id = 'intro-terminal';
    Object.assign(termContainer.style, {
      fontFamily: '"Fira Code", monospace, Consolas, Courier',
      color: this.colors.text,
      textShadow: `0 0 4px ${this.colors.glow}`,
      textAlign: 'left',
      width: '90%',
      maxWidth: '650px',
      padding: '25px',
      lineHeight: '1.7',
      fontSize: '15px',
      borderLeft: `2px solid ${this.colors.accent1}`,
      background: 'rgba(7, 9, 20, 0.65)',
      borderRadius: '8px',
      boxShadow: `0 0 30px rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(${this.colors.accent1 === '#3b82f6' ? '59,130,246' : '244,63,94'}, 0.08)`,
      opacity: '0',
      transition: 'opacity 0.3s ease'
    });
    this.overlay.appendChild(termContainer);

    // 日誌內容
    const logs = [
      { text: '> Connecting to Edison.Dev neural core...', delay: 100 },
      { text: '> Checking database and cache integrity... [OK]', delay: 250 },
      { text: '> Initializing Deep Space rendering hardware...', delay: 200 },
      { text: '> Loading AI Learning Lab knowledge graph... [100%]', delay: 350 },
      { text: '> Deploying interactive terminal sandbox...', delay: 180 },
      { text: '> Access Granted. Launching Shell...', delay: 280 }
    ];

    setTimeout(() => termContainer.style.opacity = '1', 100);

    let logIndex = 0;
    const printNextLog = () => {
      if (logIndex < logs.length) {
        const item = logs[logIndex];
        const line = document.createElement('div');
        line.style.marginBottom = '6px';
        line.textContent = '';
        termContainer.appendChild(line);

        // 字符打字效果
        let charIndex = 0;
        const typeChar = () => {
          if (charIndex < item.text.length) {
            line.textContent += item.text[charIndex++];
            setTimeout(typeChar, 12);
          } else {
            logIndex++;
            setTimeout(printNextLog, item.delay);
          }
        };
        typeChar();
      } else {
        // 完成日誌打印，過渡到 Logo 閃爍
        setTimeout(() => {
          termContainer.style.opacity = '0';
          setTimeout(() => {
            termContainer.remove();
            
            // 秀出炫酷閃爍標題
            const titleEl = this.createCenteredTitle('💻 EDISON.DEV');
            titleEl.style.opacity = '1';
            titleEl.classList.add('terminal-glitch'); // 在 CSS 中加入輕微 Glitch 閃爍
            
            setTimeout(() => {
              // 往上推開
              this.overlay.style.transform = 'translateY(-100%)';
              this.overlay.style.opacity = '0';
              setTimeout(() => this.cleanup(), 600);
            }, 1000);
          }, 350);
        }, 300);
      }
    };

    setTimeout(printNextLog, 400);
  }

  // ==========================================
  // 3. AI 神經網路連線 (Neural Network)
  // ==========================================
  playNeuralNetwork() {
    this.setupCanvas();
    const width = window.innerWidth;
    const height = window.innerHeight;

    // 初始化節點
    const numNodes = 75;
    const nodes = [];
    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: Math.random() * 2 + 1
      });
    }

    const titleEl = this.createCenteredTitle('🧠 EDISON.DEV');
    
    const animate = (timestamp) => {
      if (!this.startTime) this.startTime = timestamp;
      const elapsed = timestamp - this.startTime;

      this.ctx.fillStyle = this.colors.bg;
      this.ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // 1.5 秒後，開始點亮中央標題，並將節點吸往中心
      if (elapsed > 1200) {
        titleEl.style.opacity = Math.min((elapsed - 1200) / 600, 1);
        titleEl.style.transform = `scale(${1 - (elapsed - 1200) * 0.00015})`;
      }

      // 更新並繪製節點
      nodes.forEach(node => {
        if (elapsed > 1200) {
          // 向中心牽引
          const dx = cx - node.x;
          const dy = cy - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 10) {
            const force = (elapsed - 1200) * 0.00015;
            node.vx += (dx / dist) * force;
            node.vy += (dy / dist) * force;
          }
        }

        node.x += node.vx;
        node.y += node.vy;

        // 邊界反射
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.colors.accent2;
        this.ctx.fill();
      });

      // 繪製連線
      this.ctx.lineWidth = 0.5;
      for (let i = 0; i < numNodes; i++) {
        for (let j = i + 1; j < numNodes; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const maxDist = 120;
          if (dist < maxDist) {
            let alpha = (maxDist - dist) / maxDist * 0.25;
            
            // 隨著時間，連線朝中心匯聚，變得越亮
            if (elapsed > 1200) {
              alpha = Math.min(alpha * (1 + (elapsed - 1200) * 0.0025), 0.7);
            }

            this.ctx.beginPath();
            this.ctx.moveTo(n1.x, n1.y);
            this.ctx.lineTo(n2.x, n2.y);
            
            this.ctx.strokeStyle = `rgba(${this.colors.accent1 === '#3b82f6' ? '59,130,246' : '244,63,94'}, ${alpha})`;
            this.ctx.stroke();
          }
        }
      }

      if (elapsed < 2400) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.finish(600);
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }

  // ==========================================
  // 4. 超新星大爆炸 (Supernova)
  // ==========================================
  playSupernova() {
    this.setupCanvas();
    const width = window.innerWidth;
    const height = window.innerHeight;
    const cx = width / 2;
    const cy = height / 2;

    // 粒子
    const numParticles = 280;
    const particles = [];
    for (let i = 0; i < numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 260 + 60; // 環繞奇點半徑
      particles.push({
        angle: angle,
        orbitRadius: dist,
        size: Math.random() * 2.2 + 0.6,
        speed: (Math.random() * 0.015 + 0.005),
        x: cx + Math.cos(angle) * dist,
        y: cy + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        color: Math.random() > 0.5 ? this.colors.accent1 : this.colors.accent2
      });
    }

    const titleEl = this.createCenteredTitle('💥 EDISON.DEV');
    titleEl.style.textShadow = `0 0 25px ${this.colors.glow}`;
    
    // 用於記錄大爆炸觸發狀態
    let exploded = false;

    const animate = (timestamp) => {
      if (!this.startTime) this.startTime = timestamp;
      const elapsed = timestamp - this.startTime;

      this.ctx.fillStyle = this.colors.bg;
      this.ctx.fillRect(0, 0, width, height);

      // 階段 1：重力坍縮 (0 ~ 1300ms)
      if (elapsed <= 1300) {
        particles.forEach(p => {
          // 繞軌道旋轉
          p.angle += p.speed;
          
          // 半徑快速收縮
          const shrinkFactor = (1300 - elapsed) / 1300;
          const currentRadius = p.orbitRadius * shrinkFactor;
          
          p.x = cx + Math.cos(p.angle) * currentRadius;
          p.y = cy + Math.sin(p.angle) * currentRadius;

          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this.ctx.fillStyle = p.color;
          this.ctx.fill();
        });
      } 
      // 階段 2：大爆炸瞬間閃爍 (1300ms)
      else if (elapsed > 1300 && elapsed <= 1400) {
        if (!exploded) {
          exploded = true;
          // 大爆炸力學：為所有粒子計算爆炸速度向量 (放射狀噴發)
          particles.forEach(p => {
            const angle = Math.random() * Math.PI * 2;
            const force = Math.random() * 12 + 4; // 高速炸出
            p.vx = Math.cos(angle) * force;
            p.vy = Math.sin(angle) * force;
            p.x = cx; // 從奇點炸出
            p.y = cy;
          });
          // 給 overlay 加上白色發光閃爍的 CSS Class
          this.overlay.classList.add('flash-effect');
        }

        // 渲染高亮中心
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, width, height);
      } 
      // 階段 3：粒子爆炸噴射與 Logo 顯現 (1400ms ~ 2500ms)
      else {
        this.overlay.classList.remove('flash-effect');
        titleEl.style.opacity = Math.min((elapsed - 1400) / 400, 1);
        titleEl.style.transform = `scale(${1 + (elapsed - 1400) * 0.0002})`;

        particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          
          // 速度減緩 (空氣阻力)
          p.vx *= 0.94;
          p.vy *= 0.94;

          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this.ctx.fillStyle = p.color;
          
          // 爆炸後期粒子淡出
          const life = Math.max(0, (2500 - elapsed) / 1100);
          this.ctx.globalAlpha = life;
          this.ctx.fill();
          this.ctx.globalAlpha = 1.0;
        });
      }

      if (elapsed < 2500) {
        this.animationId = requestAnimationFrame(animate);
      } else {
        this.finish(600);
      }
    };

    this.animationId = requestAnimationFrame(animate);
  }

  // ==========================================
  // 共用輔助方法
  // ==========================================

  createCenteredTitle(text) {
    const title = document.createElement('div');
    title.className = 'intro-title';
    title.textContent = text;
    
    Object.assign(title.style, {
      position: 'absolute',
      fontFamily: '"Outfit", "Inter", sans-serif',
      fontWeight: '800',
      fontSize: '3rem',
      letterSpacing: '5px',
      color: '#ffffff',
      textShadow: `0 0 15px ${this.colors.glow}, 0 0 30px ${this.colors.accent1}`,
      opacity: '0',
      transition: 'opacity 0.6s ease, transform 0.6s ease',
      zIndex: '10',
      pointerEvents: 'none'
    });

    this.overlay.appendChild(title);
    return title;
  }

  finish(fadeOutDuration = 600) {
    // 漸變淡出 overlay
    if (this.overlay) {
      this.overlay.style.opacity = '0';
      setTimeout(() => {
        this.cleanup();
      }, fadeOutDuration);
    }
  }

  cleanup() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    
    // 如果是預覽模式，播完後將 hash 移除，避免重整時重複預覽
    if (this.isPreviewMode) {
      window.location.hash = '';
      // 通知設定面板 (如果有在設定選單中預覽，可通知恢復顯示設定視窗)
      window.dispatchEvent(new CustomEvent('intro-preview-done'));
    }
  }
}

// 提供全域預覽介面
window.playIntroPreview = function(type) {
  if (window.activeIntroInstance) {
    window.activeIntroInstance.cleanup();
  }
  const intro = new IntroController();
  intro.animationType = type;
  intro.isPreviewMode = true;
  window.activeIntroInstance = intro;
  intro.init();
};

// 頁面解析最早期立即執行 (DOMContentLoaded 之前)，防 FOUC
(function() {
  const intro = new IntroController();
  window.activeIntroInstance = intro;
  // 由於 DOM 結構可能還沒完全建立 (若 script 置於頂部)，使用事件等待 DOM body 就緒
  if (document.body) {
    intro.init();
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      intro.init();
    });
  }
})();
