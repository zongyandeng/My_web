/**
 * Edison.Dev - 全域進入動畫控制器 (Intro Animations Controller)
 * 支援 4 種科技感與宇宙深空主題的進入動畫與 Web Audio API 聲效合成：
 * 1. space-warp (星流躍遷 Canvas 動畫 + 躍遷引擎上揚風嘯聲)
 * 2. system-boot (模擬終端開機文字動畫 + 鍵盤 Click 聲與開機和弦音)
 * 3. neural-network (AI 神經網路 Canvas 動畫 + 禪意五聲音階彈撥琴音)
 * 4. supernova (引力坍縮超新星大爆炸 Canvas 動畫 + 坍縮低音與白噪聲爆炸巨響)
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

// ==========================================
// 🔌 Web Audio API 科技音效即時合成器 (Sound Synthesizer)
// ==========================================
class IntroAudioSynthesizer {
  constructor() {
    this.ctx = null;
  }

  // 檢查是否啟用音效設定 (預設為開啟 'true')
  get enabled() {
    return localStorage.getItem('intro-audio-enabled') !== 'false';
  }

  // 延遲初始化 AudioContext，以避開瀏覽器限播政策警報
  initContext() {
    if (!this.enabled) return false;
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return true;
    } catch (e) {
      console.warn('[IntroAudio] 無法建立 AudioContext:', e);
      return false;
    }
  }

  // 1. 鍵盤 Click 聲 (System Boot 打字音)
  playTyping() {
    if (!this.initContext()) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'triangle';
      // 隨機高頻模擬打字清脆 Click
      osc.frequency.setValueAtTime(850 + Math.random() * 550, now);
      
      gain.gain.setValueAtTime(0.012, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.03);
    } catch (e) {
      // 靜默忽略 Autoplay 政策擋下的錯誤
    }
  }

  // 2. 系統啟動成功音 (Beep Success Chords)
  playBootSuccess() {
    if (!this.initContext()) return;
    try {
      const now = this.ctx.currentTime;
      
      const playTone = (freq, startTime, duration, vol) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(vol, startTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // 叮-咚-叮 科技感向上和弦
      playTone(523.25, now, 0.35, 0.05);        // C5
      playTone(783.99, now + 0.07, 0.35, 0.04);   // G5
      playTone(1046.50, now + 0.16, 0.55, 0.06);  // C6
    } catch (e) {
      // 靜默忽略
    }
  }

  // 3. 星流躍遷風嘯聲 (Space Warp Engine)
  playSpaceWarp() {
    if (!this.initContext()) return;
    try {
      const now = this.ctx.currentTime;
      
      // A. 低頻躍遷引擎噪聲
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(50, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 2.0); // 頻率迅速上揚
      
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(120, now);
      filter.frequency.exponentialRampToValueAtTime(1400, now + 2.0);
      
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.035, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.2);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 2.2);
      
      // B. 1.2 秒加速突破瞬間的「咻」高發光風聲
      setTimeout(() => {
        if (!this.initContext()) return;
        const now2 = this.ctx.currentTime;
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(320, now2);
        osc2.frequency.exponentialRampToValueAtTime(1800, now2 + 0.8);
        gain2.gain.setValueAtTime(0.04, now2);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now2 + 0.8);
        
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now2);
        osc2.stop(now2 + 0.8);
      }, 1200);
    } catch (e) {
      // 靜默忽略
    }
  }

  // 4. 神經網絡隨機音符彈撥 (Neural Pluck)
  playNeuralPluck(freq) {
    if (!this.initContext()) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      
      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.75); // 空靈淡出
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.75);
    } catch (e) {
      // 靜默忽略
    }
  }

  // 5. 超新星大爆炸音效 (Supernova Explosion)
  playSupernova() {
    if (!this.initContext()) return;
    try {
      const now = this.ctx.currentTime;
      
      // A. 前半段引力坍縮低頻墜落 (Gravity Collapse)
      const collOsc = this.ctx.createOscillator();
      const collGain = this.ctx.createGain();
      collOsc.type = 'sine';
      collOsc.frequency.setValueAtTime(160, now);
      collOsc.frequency.linearRampToValueAtTime(35, now + 1.2);
      
      collGain.gain.setValueAtTime(0.06, now);
      collGain.gain.linearRampToValueAtTime(0.14, now + 1.1);
      collGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.3);
      
      collOsc.connect(collGain);
      collGain.connect(this.ctx.destination);
      collOsc.start(now);
      collOsc.stop(now + 1.3);
      
      // B. 1.3 秒大爆炸轟鳴與白噪聲 (Explosion Boom & Noise)
      setTimeout(() => {
        if (!this.initContext()) return;
        const boomNow = this.ctx.currentTime;
        
        // 1. 低頻震盪轟鳴 (Bass Boom)
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(100, boomNow);
        bassOsc.frequency.exponentialRampToValueAtTime(22, boomNow + 1.3);
        
        bassGain.gain.setValueAtTime(0.22, boomNow);
        bassGain.gain.exponentialRampToValueAtTime(0.0001, boomNow + 1.5);
        
        bassOsc.connect(bassGain);
        bassGain.connect(this.ctx.destination);
        bassOsc.start(boomNow);
        bassOsc.stop(boomNow + 1.5);
        
        // 2. 爆炸氣流與殘響 (White Noise)
        const bufferSize = this.ctx.sampleRate * 1.8;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const bufferData = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          bufferData[i] = Math.random() * 2 - 1;
        }
        
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, boomNow);
        filter.frequency.exponentialRampToValueAtTime(50, boomNow + 1.5);
        
        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.12, boomNow);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, boomNow + 1.7);
        
        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        
        noise.start(boomNow);
        noise.stop(boomNow + 1.7);
      }, 1300);
    } catch (e) {
      // 靜默忽略
    }
  }
}

// ==========================================
// 🌌 進入動畫控制器主邏輯 (Intro Controller)
// ==========================================
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
    
    // 初始化音效合成器
    this.audio = new IntroAudioSynthesizer();

    // 檢查是否為預覽模式 (URL 包含 #preview-intro)
    this.isPreviewMode = window.location.hash === '#preview-intro';
  }

  init() {
    const hasPlayed = sessionStorage.getItem(this.playedKey) === 'true';
    if (this.animationType === 'none' && !this.isPreviewMode) {
      return;
    }
    if (hasPlayed && !this.isPreviewMode) {
      return;
    }

    // 建立 Overlay 遮罩層
    this.createOverlay();

    // 根據設定播放動畫
    if (this.animationType === 'space-warp') {
      this.playSpaceWarp();
    } else if (this.animationType === 'system-boot') {
      this.playSystemBoot();
    } else if (this.animationType === 'neural-network') {
      this.playNeuralNetwork();
    } else if (this.animationType === 'supernova') {
      this.playSupernova();
    } else {
      this.finish(500);
    }

    if (!this.isPreviewMode) {
      sessionStorage.setItem(this.playedKey, 'true');
    }
  }

  createOverlay() {
    this.overlay = document.createElement('div');
    this.overlay.id = 'intro-overlay';
    
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

    const titleEl = this.createCenteredTitle('🌌 EDISON.DEV');
    
    // 啟動躍遷音效
    this.audio.playSpaceWarp();
    
    let speed = 7;
    
    const animate = (timestamp) => {
      if (!this.startTime) this.startTime = timestamp;
      const elapsed = timestamp - this.startTime;
      
      this.ctx.fillStyle = 'rgba(5, 7, 15, 0.18)'; 
      this.ctx.fillRect(0, 0, width, height);
      
      const cx = width / 2;
      const cy = height / 2;
      
      if (elapsed > 1200) {
        speed += 0.8;
        titleEl.style.opacity = Math.min((elapsed - 1200) / 600, 1);
        titleEl.style.transform = `scale(${1 + (elapsed - 1200) * 0.0003})`;
      }
      
      stars.forEach(star => {
        const kx = (star.x / star.z) * width + cx;
        const ky = (star.y / star.z) * height + cy;
        
        star.z -= speed;
        
        const nx = (star.x / star.z) * width + cx;
        const ny = (star.y / star.z) * height + cy;
        
        if (star.z <= 0 || nx < 0 || nx > width || ny < 0 || ny > height) {
          star.x = (Math.random() - 0.5) * width * 2;
          star.y = (Math.random() - 0.5) * height * 2;
          star.z = 1000;
          star.px = nx;
          star.py = ny;
        } else {
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

        let charIndex = 0;
        const typeChar = () => {
          if (charIndex < item.text.length) {
            line.textContent += item.text[charIndex++];
            // 播放鍵盤敲擊音效
            this.audio.playTyping();
            setTimeout(typeChar, 12);
          } else {
            logIndex++;
            setTimeout(printNextLog, item.delay);
          }
        };
        typeChar();
      } else {
        setTimeout(() => {
          termContainer.style.opacity = '0';
          setTimeout(() => {
            termContainer.remove();
            
            const titleEl = this.createCenteredTitle('💻 EDISON.DEV');
            titleEl.style.opacity = '1';
            titleEl.classList.add('terminal-glitch');
            
            // 播放成功開機和弦音
            this.audio.playBootSuccess();
            
            setTimeout(() => {
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
    
    // 定義禪意五聲音階 C5, D5, E5, G5, A5, C6
    const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    let lastPluckTime = 0;

    const animate = (timestamp) => {
      if (!this.startTime) this.startTime = timestamp;
      const elapsed = timestamp - this.startTime;

      this.ctx.fillStyle = this.colors.bg;
      this.ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      // 隨機彈奏五聲和弦，前 1.2 秒隨機撥放
      if (elapsed < 1200 && timestamp - lastPluckTime > 180 + Math.random() * 140) {
        const randomNote = pentatonic[Math.floor(Math.random() * pentatonic.length)];
        this.audio.playNeuralPluck(randomNote);
        lastPluckTime = timestamp;
      }

      if (elapsed > 1200) {
        titleEl.style.opacity = Math.min((elapsed - 1200) / 600, 1);
        titleEl.style.transform = `scale(${1 - (elapsed - 1200) * 0.00015})`;
      }

      nodes.forEach(node => {
        if (elapsed > 1200) {
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

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = this.colors.accent2;
        this.ctx.fill();
      });

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

    const numParticles = 280;
    const particles = [];
    for (let i = 0; i < numParticles; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 260 + 60; 
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
    
    // 啟動超新星坍縮與大爆炸合成音效
    this.audio.playSupernova();
    
    let exploded = false;

    const animate = (timestamp) => {
      if (!this.startTime) this.startTime = timestamp;
      const elapsed = timestamp - this.startTime;

      this.ctx.fillStyle = this.colors.bg;
      this.ctx.fillRect(0, 0, width, height);

      if (elapsed <= 1300) {
        particles.forEach(p => {
          p.angle += p.speed;
          
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
      else if (elapsed > 1300 && elapsed <= 1400) {
        if (!exploded) {
          exploded = true;
          particles.forEach(p => {
            const angle = Math.random() * Math.PI * 2;
            const force = Math.random() * 12 + 4; 
            p.vx = Math.cos(angle) * force;
            p.vy = Math.sin(angle) * force;
            p.x = cx; 
            p.y = cy;
          });
          this.overlay.classList.add('flash-effect');
        }

        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, width, height);
      } 
      else {
        this.overlay.classList.remove('flash-effect');
        titleEl.style.opacity = Math.min((elapsed - 1400) / 400, 1);
        titleEl.style.transform = `scale(${1 + (elapsed - 1400) * 0.0002})`;

        particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          
          p.vx *= 0.94;
          p.vy *= 0.94;

          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this.ctx.fillStyle = p.color;
          
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
    
    if (this.isPreviewMode) {
      window.location.hash = '';
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
  if (document.body) {
    intro.init();
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      intro.init();
    });
  }
})();
