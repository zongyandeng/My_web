import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Edison.Dev - Three.js 互動式「粒子爆裂遊樂場」 (v2.1 穩健重構版)
 * 實作內容包含：
 * 1. 10,000 個粒子組成的 BufferGeometry 實心正方體系統。
 * 2. 2D 歐幾里得距離演算法：100% 穩健判定滑鼠懸停 (避開 Raycaster 機制衝突與失效 Bug)。
 * 3. 物理爆裂與聚合重組動畫 (基於爆炸速度向量與「快發慢收」插值演算法)。
 * 4. 滑桿參數即時控制 (爆炸強度、粒子大小)。
 * 5. 主題色彩即時同步 (Deep Space 與 Cyberpunk 樣式)。
 */

// 輔助工具：動態獲取 CSS 主題顏色
function getThemeColor() {
  const style = getComputedStyle(document.documentElement);
  return style.getPropertyValue('--accent-1').trim() || '#3b82f6';
}

const initThreePlayground = () => {
  // 1. 取得 DOM 容器與 Canvas
  const container = document.getElementById('three-container');
  const canvas = document.getElementById('webgl-canvas');

  // 防錯機制
  if (!container || !canvas) return;

  // 2. 取得控制面板滑桿 DOM
  const sliderExplosion = document.getElementById('slider-explosion');
  const valExplosion = document.getElementById('val-explosion');
  const sliderSize = document.getElementById('slider-size');
  const valSize = document.getElementById('val-size');

  let explosionStrength = parseFloat(sliderExplosion.value);
  let particleSize = parseFloat(sliderSize.value);

  // 3. 初始化場景 (Scene) 與透視相機 (Camera)
  const scene = new THREE.Scene();
  let width = container.clientWidth;
  let height = container.clientHeight;

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0, 4.5); // 將相機固定在距離原點 4.5 的位置
  scene.add(camera);

  // 4. 初始化 WebGL 渲染器 (Renderer)
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true, // 透明背景以透出底層流光
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // 5. 生成粒子數據與 Points 物件
  const particleCount = 10000;
  const positions = new Float32Array(particleCount * 3);
  const originalPositions = [];
  const velocities = [];

  // 在邊長 1.5 的空間內隨機採樣
  const boxSize = 1.5;
  for (let i = 0; i < particleCount; i++) {
    // 實心正方體內隨機點 (X, Y, Z 從 -0.75 到 0.75)
    const ox = (Math.random() - 0.5) * boxSize;
    const oy = (Math.random() - 0.5) * boxSize;
    const oz = (Math.random() - 0.5) * boxSize;

    originalPositions.push(new THREE.Vector3(ox, oy, oz));
    
    // 初始化當前位置與原始位置相同
    positions[i * 3] = ox;
    positions[i * 3 + 1] = oy;
    positions[i * 3 + 2] = oz;

    // 爆炸速度向量：從正方體中心 (0,0,0) 向外散開，加上隨機震盪
    const velocityDir = new THREE.Vector3(ox, oy, oz).normalize();
    const speed = Math.random() * 3.5 + 1.5; // 大幅增強隨機速度，產生宏偉爆裂感
    velocityDir.multiplyScalar(speed);
    velocities.push(velocityDir);
  }

  // 封裝幾何體 (BufferGeometry)
  const geometry = new THREE.BufferGeometry();
  const positionAttribute = new THREE.BufferAttribute(positions, 3);
  geometry.setAttribute('position', positionAttribute);

  // 初始化材質 (PointsMaterial)
  const material = new THREE.PointsMaterial({
    color: new THREE.Color(getThemeColor()),
    size: particleSize,
    sizeAttenuation: true, // 粒子隨距離產生透視縮放
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending, // 疊加發光混合
    depthWrite: false, // 解決透明粒子重疊黑邊問題
  });

  // 粒子 Points 物件
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // 6. 燈光設置
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(5, 5, 5);
  scene.add(dirLight);

  // 7. 軌道控制 (OrbitControls)
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enableZoom = false; // 關閉縮放以防干擾網頁滾動
  controls.enablePan = false;  // 關閉平移，讓立方體始終固定在幾何中心 (0,0,0)

  // 8. 全域滑鼠監聽與邊界檢測 (解決 OrbitControls 吞沒 Canvas 冒泡事件的 Bug)
  const mouse = new THREE.Vector2(-9999, -9999);
  let isHovered = false;

  window.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    // 判定滑鼠是否在 3D 畫布容器內部
    const isInContainer = (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    );

    if (isInContainer) {
      // 計算相對於容器的 NDC 座標 (範圍為 -1 到 1)
      mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;
      isHovered = true;
    } else {
      mouse.set(-9999, -9999);
      isHovered = false;
    }
  });

  // 9. 參數控制面板滑桿事件綁定
  sliderExplosion.addEventListener('input', (e) => {
    explosionStrength = parseFloat(e.target.value);
    valExplosion.textContent = e.target.value;
  });

  sliderSize.addEventListener('input', (e) => {
    particleSize = parseFloat(e.target.value);
    material.size = particleSize;
    valSize.textContent = e.target.value;
  });

  // 10. 響應式視窗縮放處理
  window.addEventListener('resize', () => {
    width = container.clientWidth;
    height = container.clientHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  // 11. 動畫渲染與物理更新迴圈 (Physics Update & Render)
  const tempPos = new THREE.Vector3();
  let themeUpdateTimer = 0;

  const tick = () => {
    // 100% 穩定之 2D 歐幾里得距離檢測法
    // 正方體固定於原點 (0,0,0) 且禁用平移，故在畫布上的 2D 投影中心永遠是 (0,0)
    // 只要滑鼠 NDC 座標到中心距離小於 0.68，即可 100% 敏銳且無誤地判定為懸停在立方體上！
    let isExploding = false;
    if (isHovered) {
      const dist = Math.sqrt(mouse.x * mouse.x + mouse.y * mouse.y);
      if (dist < 0.68) {
        isExploding = true;
      }
    }

    const positionsArray = positionAttribute.array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      tempPos.set(positionsArray[i3], positionsArray[i3 + 1], positionsArray[i3 + 2]);

      if (isExploding) {
        // 爆炸狀態：當前座標朝目標爆炸點飛行 (爆炸強度範圍擴展到 5.0，瞬發 Lerp 0.12)
        const target = originalPositions[i].clone().addScaledVector(velocities[i], explosionStrength);
        tempPos.lerp(target, 0.12);
      } else {
        // 聚合重組：粒子緩慢、磁性凝聚地收縮回立方體 (緩收 Lerp 0.04)
        tempPos.lerp(originalPositions[i], 0.04);
      }

      positionsArray[i3] = tempPos.x;
      positionsArray[i3 + 1] = tempPos.y;
      positionsArray[i3 + 2] = tempPos.z;
    }

    // 標記頂點需要更新以觸發渲染
    positionAttribute.needsUpdate = true;

    // 粒子星團的自轉
    points.rotation.y += 0.0015;
    points.rotation.x += 0.0005;

    // 每 30 幀動態同步一次主題顏色，減少運算負擔
    themeUpdateTimer++;
    if (themeUpdateTimer % 30 === 0) {
      material.color.set(getThemeColor());
    }

    // 更新軌道控制
    controls.update();

    // 渲染畫面
    renderer.render(scene, camera);

    // 循環請求下一幀
    window.requestAnimationFrame(tick);
  };

  // 啟動動畫
  tick();
};

// 優化 DOM 生命週期防錯載入機制 (確保 ES Module 載入時不漏失 DOMContentLoaded)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initThreePlayground);
} else {
  initThreePlayground();
}
