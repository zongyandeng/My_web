/**
 * Edison.Dev - 首頁互動特效管理與實作
 * 包含四種滑鼠互動特效：
 * 1. 🌌 聚光燈效果 (Spotlight)
 * 2. ☄️ 科技星空連線 (Particles & Constellation)
 * 3. ✨ 流星拖尾 (Sparkle Trail)
 * 4. 🧲 磁吸式雙環游標 (Magnetic Cursor)
 */

// --- 輔助工具：動態獲取 CSS 主題顏色 ---
function getThemeColors() {
  const style = getComputedStyle(document.documentElement);
  return {
    accent1: style.getPropertyValue('--accent-1').trim() || '#3b82f6',
    accent2: style.getPropertyValue('--accent-2').trim() || '#10b981',
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
    this.maxDistance = 85; // 連線最大距離
    this.repelRadius = 120; // 滑鼠排斥半徑
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
    // 解決高解析度螢幕模糊問題
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.ctx.scale(dpr, dpr);
    this.canvas.style.width = window.innerWidth + 'px';
    this.canvas.style.height = window.innerHeight + 'px';
    this.colors = getThemeColors(); // 縮放時順便重新讀取顏色，適應主題切換
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
    // 根據畫面大小動態調整粒子數量
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
    this.colors = getThemeColors(); // 每一影格適配主題顏色切換

    const len = this.particles.length;

    // 1. 更新並繪製粒子
    for (let i = 0; i < len; i++) {
      const p = this.particles[i];

      // 物理排斥：當滑鼠靠近時，粒子會被推開
      if (this.mouse.active && this.mouse.x !== null) {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.repelRadius) {
          const force = (this.repelRadius - dist) / this.repelRadius; // 越近力道越大
          const angle = Math.atan2(dy, dx);
          // 施加排斥加速度
          p.x += Math.cos(angle) * force * 1.8;
          p.y += Math.sin(angle) * force * 1.8;
        }
      }

      // 粒子自然漂移
      p.x += p.vx;
      p.y += p.vy;

      // 邊界反彈
      if (p.x < 0 || p.x > window.innerWidth) p.vx *= -1;
      if (p.y < 0 || p.y > window.innerHeight) p.vy *= -1;
      
      // 確保邊界碰撞後不卡出畫面
      p.x = Math.max(0, Math.min(window.innerWidth, p.x));
      p.y = Math.max(0, Math.min(window.innerHeight, p.y));

      // 繪製粒子
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.colorType === 'accent1' ? this.colors.accent1 : this.colors.accent2;
      this.ctx.shadowBlur = 4;
      this.ctx.shadowColor = this.ctx.fillStyle;
      this.ctx.fill();
      this.ctx.shadowBlur = 0; // 重置陰影，避免效能低落
    }

    // 2. 繪製粒子與粒子、粒子與滑鼠之間的連線
    for (let i = 0; i < len; i++) {
      const p1 = this.particles[i];

      // 粒子與滑鼠連線
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

      // 粒子與粒子連線
      for (let j = i + 1; j < len; j++) {
        const p2 = this.particles[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < this.maxDistance) {
          // 距離越近，連線越明顯
          const alpha = (this.maxDistance - dist) / this.maxDistance * 0.12;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          
          // 漸層色連線
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
    // 計算滑鼠移動速度
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
    const dx = this.mouse.x - this.mouse.px;
    const dy = this.mouse.y - this.mouse.py;
    this.mouse.speed = Math.sqrt(dx * dx + dy * dy);
    
    // 更新上一次的位置
    this.mouse.px = this.mouse.x;
    this.mouse.py = this.mouse.y;

    // 當滑鼠移動時產生粒子 (速度越快，產生的粒子越多)
    const count = Math.min(Math.floor(this.mouse.speed / 2) + 1, 6);
    this.colors = getThemeColors();

    for (let i = 0; i < count; i++) {
      // 在滑鼠附近微幅隨機偏移
      const offsetX = (Math.random() - 0.5) * 8;
      const offsetY = (Math.random() - 0.5) * 8;

      // 噴射速度
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 2 + 0.5;

      this.sparkles.push({
        x: this.mouse.x + offsetX,
        y: this.mouse.y + offsetY,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 0.5, // 向上噴射微偏
        size: Math.random() * 4 + 2,
        color: Math.random() > 0.5 ? this.colors.accent1 : this.colors.accent2,
        alpha: 1.0,
        decay: Math.random() * 0.02 + 0.015
      });
    }
  }

  animate() {
    // 留下微弱的殘影效果，營造流暢感
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    
    // 清除畫布，但保持半透明以顯示殘影，如果不需要殘影則用 clearRect
    // 這裡我們直接用 clearRect 清理，並用手動的 alpha 混合，以獲得最精緻的霓虹效果。
    this.ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i];
      
      // 物理更新
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.03; // 微小重力
      s.vx *= 0.98; // 空氣阻力
      s.alpha -= s.decay;
      s.size -= 0.04;

      if (s.alpha <= 0 || s.size <= 0) {
        this.sparkles.splice(i, 1);
        continue;
      }

      // 繪製粒子 (發光霓虹小圓球)
      this.ctx.save();
      this.ctx.globalAlpha = s.alpha;
      this.ctx.beginPath();
      this.ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      this.ctx.fillStyle = s.color;
      
      // 粒子霓虹發光
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

    this.mouse = { x: -100, y: -100 }; // 滑鼠座標
    this.dotPos = { x: -100, y: -100 }; // 內圓座標
    this.ringPos = { x: -100, y: -100 }; // 外環座標
    this.animationId = null;

    // 磁吸狀態資訊
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

    // 重設樣式
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
    // 找出首頁中所有可點擊元素
    const targets = document.querySelectorAll('.menu-card, .navbar a, .navbar button, .theme-toggle-btn');
    targets.forEach(el => {
      el.addEventListener('mouseenter', this.handleMouseEnterTarget);
      el.addEventListener('mouseleave', this.handleMouseLeaveTarget);
      el.addEventListener('mousemove', this.handleTargetMouseMove);
    });
  }

  unbindMagneticElements() {
    const targets = document.querySelectorAll('.menu-card, .navbar a, .navbar button, .theme-toggle-btn');
    targets.forEach(el => {
      el.removeEventListener('mouseenter', this.handleMouseEnterTarget);
      el.removeEventListener('mouseleave', this.handleMouseLeaveTarget);
      el.removeEventListener('mousemove', this.handleTargetMouseMove);
      // 重設拉扯偏移
      el.style.transform = '';
      el.style.transition = '';
    });
  }

  handleMouseEnterTarget(e) {
    this.isHoveringTarget = true;
    this.targetEl = e.currentTarget;
    this.targetRect = this.targetEl.getBoundingClientRect();
    
    // 給外環加上吸附樣式
    this.ring.classList.add('hovered');
    
    // 如果是 menu-card 之外的小按鈕，給予磁吸按鈕回饋
    if (!this.targetEl.classList.contains('menu-card')) {
      this.targetEl.style.transition = 'transform 0.1s ease';
    }
  }

  handleMouseLeaveTarget(e) {
    this.isHoveringTarget = false;
    
    // 還原外環樣式
    this.ring.classList.remove('hovered');
    this.ring.style.width = '30px';
    this.ring.style.height = '30px';
    this.ring.style.borderRadius = '50%';

    // 還原元素偏離
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

    // 計算滑鼠與元素中心的距離，實現按鈕吸附拉扯效果
    const centerX = this.targetRect.left + this.targetRect.width / 2;
    const centerY = this.targetRect.top + this.targetRect.height / 2;
    
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;

    // 限制偏移幅度 (小按鈕限制 8px，卡片不直接偏移 transform，因為卡片本身有 3D 傾斜)
    if (!this.targetEl.classList.contains('menu-card')) {
      const dragFactor = 0.25;
      const pullX = deltaX * dragFactor;
      const pullY = deltaY * dragFactor;
      this.targetEl.style.transform = `translate(${pullX.toFixed(1)}px, ${pullY.toFixed(1)}px)`;
    }
  }

  animate() {
    // 1. 內圓緊緊跟隨滑鼠
    this.dotPos.x += (this.mouse.x - this.dotPos.x);
    this.dotPos.y += (this.mouse.y - this.dotPos.y);
    this.dot.style.transform = `translate3d(${this.dotPos.x - 4}px, ${this.dotPos.y - 4}px, 0)`;

    // 2. 外環平滑插值跟隨 (Lerp 物理延遲效果)
    if (this.isHoveringTarget && this.targetRect && this.targetEl) {
      // 磁吸狀態：外環包覆住被吸附的按鈕
      const rect = this.targetRect;
      
      // 計算目標位置與尺寸 (加上 padding)
      const padding = 8;
      const targetW = rect.width + padding * 2;
      const targetH = rect.height + padding * 2;
      const targetX = rect.left - padding;
      const targetY = rect.top - padding;

      // 平滑逼近目標尺寸與位置
      this.ringPos.x += (targetX - this.ringPos.x) * 0.2;
      this.ringPos.y += (targetY - this.ringPos.y) * 0.2;
      
      const currentW = parseFloat(this.ring.style.width) || 30;
      const currentH = parseFloat(this.ring.style.height) || 30;
      
      const newW = currentW + (targetW - currentW) * 0.2;
      const newH = currentH + (targetH - currentH) * 0.2;

      this.ring.style.width = `${newW}px`;
      this.ring.style.height = `${newH}px`;
      
      // 讀取圓角
      const borderRadius = window.getComputedStyle(this.targetEl).borderRadius;
      this.ring.style.borderRadius = borderRadius;

      this.ring.style.transform = `translate3d(${this.ringPos.x}px, ${this.ringPos.y}px, 0)`;
    } else {
      // 自由狀態：外環跟隨滑鼠，有平滑阻尼感
      const delay = 0.15; // 延遲係數，越小越平滑/延遲越久
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

    // 初始化各個特效模組
    this.effects = {
      none: { start: () => {}, stop: () => {} },
      spotlight: new SpotlightEffect(),
      particles: new ParticlesEffect(this.canvas),
      trail: new TrailEffect(this.canvas),
      magnetic: new MagneticCursorEffect(this.cursorEl)
    };

    this.initPanel();
  }

  initPanel() {
    const panel = document.getElementById('effects-panel');
    const panelHeader = document.getElementById('panel-header');
    const panelBody = document.getElementById('panel-body');
    const toggleBtn = document.getElementById('panel-toggle');
    const buttons = document.querySelectorAll('.effect-btn');

    if (!panel || !panelHeader || !buttons.length) return;

    // 1. 面板展開與收合
    panelHeader.addEventListener('click', () => {
      panelBody.classList.toggle('collapsed');
      if (panelBody.classList.contains('collapsed')) {
        toggleBtn.textContent = '▲';
        toggleBtn.style.transform = 'rotate(0deg)';
      } else {
        toggleBtn.textContent = '▼';
      }
    });

    // 2. 切換按鈕事件綁定
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        const effectName = btn.getAttribute('data-effect');
        if (effectName === this.activeEffect) return;

        // 移除所有按鈕 active 樣式
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.switchEffect(effectName);
      });
    });
  }

  switchEffect(newEffectName) {
    console.log(`[EffectsManager] 切換特效: ${this.activeEffect} -> ${newEffectName}`);
    
    // 1. 停止目前的特效
    if (this.effects[this.activeEffect]) {
      this.effects[this.activeEffect].stop();
    }

    // 2. 更新並啟動新特效
    this.activeEffect = newEffectName;
    if (this.effects[newEffectName]) {
      this.effects[newEffectName].start();
    }
  }
}

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', () => {
  window.effectsManager = new EffectsManager();
});
