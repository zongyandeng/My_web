/**
 * Edison.Dev - 全域設定與滑鼠特效管理器 (Settings & Interaction Effects Manager)
 * 整合並管理網頁主題切換、5 種滑鼠互動特效以及進入動畫設定，提供全域統一的 Glassmorphism 控制面板。
 */

// --- 輔助工具：動態獲取 CSS 主題顏色 ---
function getThemeColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    accent1: style.getPropertyValue('--accent-1').trim() || '#3b82f6',
    accent2: style.getPropertyValue('--accent-2').trim() || '#a855f7',
    glow: style.getPropertyValue('--glow-color').trim() || 'rgba(59, 130, 246, 0.15)',
  };
}

// ==========================================
// 1. 🌌 聚光燈效果 (Spotlight Effect)
// ==========================================
class SpotlightEffect {
  constructor() {
    this.handleMouseMove = this.handleMouseMove.bind(this);
  }

  start() {
    document.addEventListener('mousemove', this.handleMouseMove);
    document.body.classList.add('spotlight-active');
  }

  stop() {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.body.classList.remove('spotlight-active');
    document.documentElement.style.removeProperty('--mouse-x');
    document.documentElement.style.removeProperty('--mouse-y');
  }

  handleMouseMove(e) {
    const x = e.clientX + 'px';
    const y = e.clientY + 'px';
    document.documentElement.style.setProperty('--mouse-x', x);
    document.documentElement.style.setProperty('--mouse-y', y);
  }
}

// ==========================================
// 2. ☄️ 科技星空連線 (Particles Effect)
// ==========================================
class ParticlesEffect {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particles = [];
    this.animationId = null;
    this.mouse = { x: null, y: null, active: false };
    this.maxDistance = 85; 
    this.repelRadius = 120; 
    this.colors = getThemeColors();

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseLeave = this.handleMouseLeave.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  start() {
    this.canvas.style.display = 'block';
    this.handleResize();
    this.initParticles();
    
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseleave', this.handleMouseLeave);

    this.animate();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseleave', this.handleMouseLeave);

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.style.display = 'none';
    this.particles = [];
  }

  handleResize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.colors = getThemeColors(); 
  }

  handleMouseMove(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
    this.mouse.active = true;
  }

  handleMouseLeave() {
    this.mouse.active = false;
    this.mouse.x = null;
    this.mouse.y = null;
  }

  initParticles() {
    this.particles = [];
    const particleCount = Math.floor((window.innerWidth * window.innerHeight) / 18000);
    const count = Math.min(Math.max(particleCount, 40), 90);

    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        radius: Math.random() * 1.5 + 0.8,
        colorType: Math.random() > 0.5 ? 'accent1' : 'accent2'
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    this.colors = getThemeColors(); 

    const len = this.particles.length;

    for (let i = 0; i < len; i++) {
      const p = this.particles[i];

      if (this.mouse.active && this.mouse.x !== null) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.repelRadius) {
          const force = (this.repelRadius - dist) / this.repelRadius; 
          const angle = Math.atan2(dy, dx);
          p.x += Math.cos(angle) * force * 1.8;
          p.y += Math.sin(angle) * force * 1.8;
        }
      }

      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > window.innerWidth) p.vx *= -1;
      if (p.y < 0 || p.y > window.innerHeight) p.vy *= -1;
      
      p.x = Math.max(0, Math.min(window.innerWidth, p.x));
      p.y = Math.max(0, Math.min(window.innerHeight, p.y));

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.colorType === 'accent1' ? this.colors.accent1 : this.colors.accent2;
      this.ctx.shadowBlur = 4;
      this.ctx.shadowColor = this.ctx.fillStyle;
      this.ctx.fill();
      this.ctx.shadowBlur = 0; 
    }

    for (let i = 0; i < len; i++) {
      const p1 = this.particles[i];

      if (this.mouse.active && this.mouse.x !== null) {
        const dx = p1.x - this.mouse.x;
        const dy = p1.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 100) {
          const alpha = (100 - dist) / 100 * 0.15;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(this.mouse.x, this.mouse.y);
          this.ctx.strokeStyle = this.colors.accent1;
          this.ctx.lineWidth = 0.5;
          this.ctx.globalAlpha = alpha;
          this.ctx.stroke();
          this.ctx.globalAlpha = 1.0;
        }
      }

      for (let j = i + 1; j < len; j++) {
        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.maxDistance) {
          const alpha = (this.maxDistance - dist) / this.maxDistance * 0.12;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          
          const grad = this.ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
          const c1 = p1.colorType === 'accent1' ? this.colors.accent1 : this.colors.accent2;
          const c2 = p2.colorType === 'accent1' ? this.colors.accent1 : this.colors.accent2;
          grad.addColorStop(0, c1);
          grad.addColorStop(1, c2);

          this.ctx.strokeStyle = grad;
          this.ctx.lineWidth = 0.4;
          this.ctx.globalAlpha = alpha;
          this.ctx.stroke();
          this.ctx.globalAlpha = 1.0;
        }
      }
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }
}

// ==========================================
// 3. ✨ 流星拖尾 (Trail Effect)
// ==========================================
class TrailEffect {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.sparkles = [];
    this.animationId = null;
    this.colors = getThemeColors();
    this.mouse = { x: 0, y: 0, px: 0, py: 0, speed: 0 };

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  start() {
    this.canvas.style.display = 'block';
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('mousemove', this.handleMouseMove);
    this.animate();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('mousemove', this.handleMouseMove);

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvas.style.display = 'none';
    this.sparkles = [];
  }

  handleResize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.colors = getThemeColors();
  }

  handleMouseMove(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
    const dx = this.mouse.x - this.mouse.px;
    const dy = this.mouse.y - this.mouse.py;
    this.mouse.speed = Math.sqrt(dx * dx + dy * dy);
    
    this.mouse.px = this.mouse.x;
    this.mouse.py = this.mouse.y;

    const count = Math.min(Math.floor(this.mouse.speed / 2) + 1, 6);
    this.colors = getThemeColors();

    for (let i = 0; i < count; i++) {
      const offsetX = (Math.random() - 0.5) * 8;
      const offsetY = (Math.random() - 0.5) * 8;
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 2 + 0.5;

      this.sparkles.push({
        x: this.mouse.x + offsetX,
        y: this.mouse.y + offsetY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 0.5, 
        size: Math.random() * 4 + 2,
        color: Math.random() > 0.5 ? this.colors.accent1 : this.colors.accent2,
        alpha: 1.0,
        decay: Math.random() * 0.02 + 0.015
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.03; 
      s.vx *= 0.98; 
      s.alpha -= s.decay;
      s.size -= 0.04;

      if (s.alpha <= 0 || s.size <= 0) {
        this.sparkles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.globalAlpha = s.alpha;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      this.ctx.fillStyle = s.color;
      this.ctx.shadowBlur = 8;
      this.ctx.shadowColor = s.color;
      this.ctx.fill();
      this.ctx.restore();
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }
}

// ==========================================
// 4. 🧲 磁吸式客製游標 (Magnetic Cursor Effect)
// ==========================================
class MagneticCursorEffect {
  constructor(cursorEl) {
    this.cursorEl = cursorEl;
    this.dot = cursorEl.querySelector('.cursor-dot');
    this.ring = cursorEl.querySelector('.cursor-ring');

    this.mouse = { x: -100, y: -100 }; 
    this.dotPos = { x: -100, y: -100 }; 
    this.ringPos = { x: -100, y: -100 }; 
    this.animationId = null;

    this.isHoveringTarget = false;
    this.targetRect = null;
    this.targetEl = null;

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseEnterTarget = this.handleMouseEnterTarget.bind(this);
    this.handleMouseLeaveTarget = this.handleMouseLeaveTarget.bind(this);
    this.handleTargetMouseMove = this.handleTargetMouseMove.bind(this);
  }

  start() {
    this.cursorEl.style.display = 'block';
    document.body.classList.add('hide-cursor');

    window.addEventListener('mousemove', this.handleMouseMove);
    this.bindMagneticElements();
    this.animate();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    window.removeEventListener('mousemove', this.handleMouseMove);
    this.unbindMagneticElements();

    document.body.classList.remove('hide-cursor');
    this.cursorEl.style.display = 'none';

    this.ring.style.width = '';
    this.ring.style.height = '';
    this.ring.style.borderRadius = '';
    this.ring.style.transform = '';
  }

  handleMouseMove(e) {
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  bindMagneticElements() {
    // 綁定全站內所有可點擊的高交互元素，提升精緻感
    const targets = document.querySelectorAll(
      '.menu-card, .navbar a, .navbar button, .settings-btn, .sidebar-item, .terminal-category-btn, .terminal-close-btn, .settings-opt-btn, .settings-preview-btn, a.btn, button'
    );
    targets.forEach(el => {
      el.addEventListener('mouseenter', this.handleMouseEnterTarget);
      el.addEventListener('mouseleave', this.handleMouseLeaveTarget);
      el.addEventListener('mousemove', this.handleTargetMouseMove);
    });
  }

  unbindMagneticElements() {
    const targets = document.querySelectorAll(
      '.menu-card, .navbar a, .navbar button, .settings-btn, .sidebar-item, .terminal-category-btn, .terminal-close-btn, .settings-opt-btn, .settings-preview-btn, a.btn, button'
    );
    targets.forEach(el => {
      el.removeEventListener('mouseenter', this.handleMouseEnterTarget);
      el.removeEventListener('mouseleave', this.handleMouseLeaveTarget);
      el.removeEventListener('mousemove', this.handleTargetMouseMove);
      el.style.transform = '';
      el.style.transition = '';
    });
  }

  handleMouseEnterTarget(e) {
    this.isHoveringTarget = true;
    this.targetEl = e.currentTarget;
    this.targetRect = this.targetEl.getBoundingClientRect();
    this.ring.classList.add('hovered');
    
    if (!this.targetEl.classList.contains('menu-card')) {
      this.targetEl.style.transition = 'transform 0.1s ease';
    }
  }

  handleMouseLeaveTarget(e) {
    this.isHoveringTarget = false;
    this.ring.classList.remove('hovered');
    this.ring.style.width = '30px';
    this.ring.style.height = '30px';
    this.ring.style.borderRadius = '50%';

    if (this.targetEl) {
      if (!this.targetEl.classList.contains('menu-card')) {
        this.targetEl.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
        this.targetEl.style.transform = 'translate(0px, 0px)';
      }
    }
    this.targetEl = null;
    this.targetRect = null;
  }

  handleTargetMouseMove(e) {
    if (!this.targetEl || !this.targetRect) return;

    const centerX = this.targetRect.left + this.targetRect.width / 2;
    const centerY = this.targetRect.top + this.targetRect.height / 2;
    
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;

    if (!this.targetEl.classList.contains('menu-card')) {
      const dragFactor = 0.25;
      const pullX = deltaX * dragFactor;
      const pullY = deltaY * dragFactor;
      this.targetEl.style.transform = `translate(${pullX.toFixed(1)}px, ${pullY.toFixed(1)}px)`;
    }
  }

  animate() {
    this.dotPos.x += (this.mouse.x - this.dotPos.x);
    this.dotPos.y += (this.mouse.y - this.dotPos.y);
    this.dot.style.transform = `translate3d(${this.dotPos.x - 4}px, ${this.dotPos.y - 4}px, 0)`;

    if (this.isHoveringTarget && this.targetRect && this.targetEl) {
      const rect = this.targetRect;
      const padding = 8;
      const targetW = rect.width + padding * 2;
      const targetH = rect.height + padding * 2;
      const targetX = rect.left - padding;
      const targetY = rect.top - padding;

      this.ringPos.x += (targetX - this.ringPos.x) * 0.2;
      this.ringPos.y += (targetY - this.ringPos.y) * 0.2;
      
      const currentW = parseFloat(this.ring.style.width) || 30;
      const currentH = parseFloat(this.ring.style.height) || 30;
      
      const newW = currentW + (targetW - currentW) * 0.2;
      const newH = currentH + (targetH - currentH) * 0.2;

      this.ring.style.width = `${newW}px`;
      this.ring.style.height = `${newH}px`;
      
      const borderRadius = window.getComputedStyle(this.targetEl).borderRadius;
      this.ring.style.borderRadius = borderRadius;

      this.ring.style.transform = `translate3d(${this.ringPos.x}px, ${this.ringPos.y}px, 0)`;
    } else {
      const delay = 0.15; 
      this.ringPos.x += (this.mouse.x - 15 - this.ringPos.x) * delay;
      this.ringPos.y += (this.mouse.y - 15 - this.ringPos.y) * delay;

      this.ring.style.transform = `translate3d(${this.ringPos.x}px, ${this.ringPos.y}px, 0)`;
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }
}

// ==========================================
// 5. 核心特效切換管理器 (Effects Manager)
// ==========================================
class EffectsManager {
  constructor() {
    this.canvas = document.getElementById('effect-canvas');
    this.cursorEl = document.getElementById('custom-cursor');
    this.activeEffect = 'none';

    this.effects = {
      none: { start: () => {}, stop: () => {} },
      spotlight: new SpotlightEffect(),
      particles: new ParticlesEffect(this.canvas),
      trail: new TrailEffect(this.canvas),
      magnetic: new MagneticCursorEffect(this.cursorEl)
    };
  }

  switchEffect(newEffectName) {
    if (newEffectName === this.activeEffect) return;
    
    console.log(`[EffectsManager] 切換特效: ${this.activeEffect} -> ${newEffectName}`);
    
    if (this.effects[this.activeEffect]) {
      this.effects[this.activeEffect].stop();
    }

    this.activeEffect = newEffectName;
    if (this.effects[newEffectName]) {
      this.effects[newEffectName].start();
    }
  }
}

// ==========================================
// 6. 全域設定面板管理器 (Settings Manager)
// ==========================================
class SettingsManager {
  constructor() {
    this.effectsManager = null;
    this.modal = null;
    this.toggleBtn = null;
    this.closeBtn = null;
    this.overlay = null;
  }

  init() {
    // 1. 動態插入特效所需 HTML 元素 (如果不存在)
    this.ensureEffectsElements();

    // 2. 初始化特效切換管理器
    this.effectsManager = new EffectsManager();

    // 3. 動態插入設定面板 HTML 結構
    this.injectSettingsDOM();

    // 4. 讀取並應用 localStorage 設定
    this.loadAndApplySettings();

    // 5. 綁定設定面板交互事件
    this.bindEvents();
  }

  ensureEffectsElements() {
    // 確保有 Canvas
    if (!document.getElementById('effect-canvas')) {
      const canvas = document.createElement('canvas');
      canvas.id = 'effect-canvas';
      canvas.className = 'effect-canvas';
      Object.assign(canvas.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        zIndex: '1',
        pointerEvents: 'none',
        display: 'none'
      });
      document.body.appendChild(canvas);
    }

    // 確保有客製磁吸游標
    if (!document.getElementById('custom-cursor')) {
      const cursor = document.createElement('div');
      cursor.id = 'custom-cursor';
      cursor.className = 'custom-cursor';
      cursor.innerHTML = `
        <div class="cursor-dot"></div>
        <div class="cursor-ring"></div>
      `;
      Object.assign(cursor.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        zIndex: '999998',
        pointerEvents: 'none',
        display: 'none'
      });
      document.body.appendChild(cursor);
    }
  }

  injectSettingsDOM() {
    const modalHtml = `
      <div class="settings-modal-overlay" id="settings-modal-overlay"></div>
      <div class="settings-modal-content">
        <div class="settings-modal-header">
          <h2>⚙️ 設定控制中心</h2>
          <button class="settings-modal-close" id="settings-modal-close">&times;</button>
        </div>
        <div class="settings-modal-body">
          
          <!-- 區塊 1: 網頁風格 -->
          <div class="settings-section">
            <h3 class="section-subtitle">🎨 網頁主題風格</h3>
            <div class="settings-options theme-options">
              <button class="settings-opt-btn" data-theme-val="deepspace">
                <span class="opt-icon">🌌</span>
                <span class="opt-name">Deep Space</span>
              </button>
              <button class="settings-opt-btn" data-theme-val="cyberpunk">
                <span class="opt-icon">⚡</span>
                <span class="opt-name">Cyberpunk</span>
              </button>
            </div>
          </div>
          
          <!-- 區塊 2: 滑鼠特效 -->
          <div class="settings-section">
            <h3 class="section-subtitle">☄️ 滑鼠互動特效</h3>
            <div class="settings-options effect-options">
              <button class="settings-opt-btn" data-effect-val="none">📴 無特效</button>
              <button class="settings-opt-btn" data-effect-val="spotlight">🌌 聚光燈</button>
              <button class="settings-opt-btn" data-effect-val="particles">☄️ 科技連線</button>
              <button class="settings-opt-btn" data-effect-val="trail">✨ 流星拖尾</button>
              <button class="settings-opt-btn" data-effect-val="magnetic">🧲 磁吸游標</button>
            </div>
          </div>

          <!-- 區塊 3: 進入動畫 -->
          <div class="settings-section">
            <h3 class="section-subtitle">🚀 進入動畫效果</h3>
            <div class="settings-options intro-options">
              <div class="intro-option-row">
                <button class="settings-opt-btn" data-intro-val="space-warp">🌌 星流躍遷</button>
                <button class="settings-preview-btn" data-intro-preview="space-warp">👁️ 預覽</button>
              </div>
              <div class="intro-option-row">
                <button class="settings-opt-btn" data-intro-val="system-boot">💻 終端開機</button>
                <button class="settings-preview-btn" data-intro-preview="system-boot">👁️ 預覽</button>
              </div>
              <div class="intro-option-row">
                <button class="settings-opt-btn" data-intro-val="neural-network">🧠 神經網路</button>
                <button class="settings-preview-btn" data-intro-preview="neural-network">👁️ 預覽</button>
              </div>
              <div class="intro-option-row">
                <button class="settings-opt-btn" data-intro-val="supernova">💥 超新星</button>
                <button class="settings-preview-btn" data-intro-preview="supernova">👁️ 預覽</button>
              </div>
              <div class="intro-option-row">
                <button class="settings-opt-btn" data-intro-val="none">📴 關閉動畫</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;

    this.modal = document.createElement('div');
    this.modal.id = 'settings-modal';
    this.modal.className = 'settings-modal';
    this.modal.innerHTML = modalHtml;
    document.body.appendChild(this.modal);

    this.closeBtn = document.getElementById('settings-modal-close');
    this.overlay = document.getElementById('settings-modal-overlay');
  }

  loadAndApplySettings() {
    // 1. 套用主題
    const savedTheme = localStorage.getItem('theme') || 'deepspace';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateActiveBtn('.theme-options .settings-opt-btn', 'data-theme-val', savedTheme);

    // 2. 套用滑鼠特效
    const savedEffect = localStorage.getItem('mouse-effect') || 'none';
    this.effectsManager.switchEffect(savedEffect);
    this.updateActiveBtn('.effect-options .settings-opt-btn', 'data-effect-val', savedEffect);

    // 3. 套用進入動畫
    const savedIntro = localStorage.getItem('intro-animation') || 'space-warp';
    this.updateActiveBtn('.intro-options .settings-opt-btn', 'data-intro-val', savedIntro);
  }

  updateActiveBtn(selector, attrName, activeValue) {
    const buttons = this.modal.querySelectorAll(selector);
    buttons.forEach(btn => {
      if (btn.getAttribute(attrName) === activeValue) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  bindEvents() {
    this.toggleBtn = document.getElementById('settings-toggle');
    if (this.toggleBtn) {
      this.toggleBtn.innerHTML = '<span class="settings-icon">⚙️</span> 設定';
      this.toggleBtn.addEventListener('click', () => this.openModal());
    }

    // 關閉事件
    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.closeModal());
    if (this.overlay) this.overlay.addEventListener('click', () => this.closeModal());

    // ESC 鍵關閉
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('open')) {
        this.closeModal();
      }
    });

    // 監聽預覽動畫結束的事件，重新把設定視窗秀出來
    window.addEventListener('intro-preview-done', () => {
      this.modal.style.display = 'flex';
      setTimeout(() => {
        this.modal.classList.add('open');
      }, 50);
    });

    // 1. 主題風格切換綁定
    const themeBtns = this.modal.querySelectorAll('.theme-options .settings-opt-btn');
    themeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-theme-val');
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.updateActiveBtn('.theme-options .settings-opt-btn', 'data-theme-val', theme);
        
        // 重新縮放 Canvas 來載入主題配色顏色
        if (window.effectsManager) {
          const active = window.effectsManager.activeEffect;
          if (active === 'particles' || active === 'trail') {
            window.effectsManager.effects[active].handleResize();
          }
        }
      });
    });

    // 2. 滑鼠特效切換綁定
    const effectBtns = this.modal.querySelectorAll('.effect-options .settings-opt-btn');
    effectBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const effect = btn.getAttribute('data-effect-val');
        this.effectsManager.switchEffect(effect);
        localStorage.setItem('mouse-effect', effect);
        this.updateActiveBtn('.effect-options .settings-opt-btn', 'data-effect-val', effect);
      });
    });

    // 3. 進入動畫設定綁定
    const introBtns = this.modal.querySelectorAll('.intro-options .settings-opt-btn');
    introBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const introVal = btn.getAttribute('data-intro-val');
        localStorage.setItem('intro-animation', introVal);
        this.updateActiveBtn('.intro-options .settings-opt-btn', 'data-intro-val', introVal);
      });
    });

    // 4. 動畫預覽按鈕綁定
    const previewBtns = this.modal.querySelectorAll('.settings-preview-btn');
    previewBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-intro-preview');
        // 隱藏設定面板，避免影響動畫視覺
        this.modal.classList.remove('open');
        setTimeout(() => {
          this.modal.style.display = 'none';
          // 呼叫全域進入動畫引擎的預覽介面
          if (typeof window.playIntroPreview === 'function') {
            window.playIntroPreview(type);
          } else {
            console.warn('[SettingsManager] 找不到 window.playIntroPreview 方法！');
            this.modal.style.display = 'flex';
            this.modal.classList.add('open');
          }
        }, 300);
      });
    });
  }

  openModal() {
    this.modal.style.display = 'flex';
    // 延遲以觸發 CSS Transition
    setTimeout(() => {
      this.modal.classList.add('open');
    }, 10);
  }

  closeModal() {
    this.modal.classList.remove('open');
    setTimeout(() => {
      this.modal.style.display = 'none';
    }, 400); // 配合 CSS transition 時長
  }
}

// 頁面載入完成後初始化設定與特效管理器
document.addEventListener('DOMContentLoaded', () => {
  const settingsMgr = new SettingsManager();
  settingsMgr.init();
  window.settingsManager = settingsMgr;
  // 將 effectsManager 挂在 window 下，與舊程式碼相容
  window.effectsManager = settingsMgr.effectsManager;
});
