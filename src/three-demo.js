import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Edison.Dev - Three.js 互動式「粒子爆裂遊樂場」
 * 實作內容包含：
 * 1. 10,000 個粒子組成的 BufferGeometry 實心正方體系統。
 * 2. Raycaster 實作滑鼠懸停偵測 (NDC 座標轉換)。
 * 3. 物理爆裂與聚合重組動畫 (基於爆炸速度向量與平滑 Lerp 插值)。
 * 4. 滑桿參數即時控制 (爆炸強度、粒子大小)。
 * 5. 主題色彩即時同步 (Deep Space 與 Cyberpunk 樣式)。
 */

// 輔助工具：動態獲取 CSS 主題顏色
function getThemeColor() {
  const style = getComputedStyle(document.documentElement);
  return style.getPropertyValue('--accent-1').trim() || '#3b82f6';
}

document.addEventListener('DOMContentLoaded', () => {
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
  camera.position.set(0, 0, 4.5);
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

  // 在邊長 1.5 的虛擬正方體空間內隨機採樣
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

    // 爆炸速度向量：從正方體中心 (0,0,0) 向粒子座標延伸的方向，加上隨機震盪
    const velocityDir = new THREE.Vector3(ox, oy, oz).normalize();
    const speed = Math.random() * 3.5 + 1.5; // 大幅增強隨機速度強度，產生超強爆裂感
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
    sizeAttenuation: true, // 粒子大小隨距離衰減，產生 3D 透視感
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending, // 混合疊加發光效果
    depthWrite: false, // 關閉深度寫入，解決透明粒子重疊黑邊問題
  });

  // 粒子 Points 物件
  const points = new THREE.Points(geometry, material);
  scene.add(points);

  // 隱形交互輔助 Mesh (用於穩定的 Raycaster 檢測)
  const interactGeometry = new THREE.BoxGeometry(1.6, 1.6, 1.6);
  const interactMaterial = new THREE.MeshBasicMaterial({ visible: false });
  const interactMesh = new THREE.Mesh(interactGeometry, interactMaterial);
  scene.add(interactMesh);

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
  controls.enablePan = false;

  // 8. 射線追蹤與滑鼠懸停檢測 (Raycaster)
  const raycaster = new THREE.Raycaster();
  // 調大 Points 檢測閾值，讓滑鼠即使在邊緣也能敏銳觸發爆炸
  raycaster.params.Points.threshold = 0.18; 

  const mouse = new THREE.Vector2(-9999, -9999); // 初始放置在極遠處
  let isHovered = false;

  // 全域監聽滑鼠移動事件 (解決 OrbitControls 在 canvas 上阻止事件冒泡導致容器收不到事件的 Bug)
  window.addEventListener('mousemove', (e) => {
    const rect = container.getBoundingClientRect();
    // 判定滑鼠座標是否在 3D 容器的矩形區域內
    const isInContainer = (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    );

    if (isInContainer) {
      mouse.x = ((e.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / container.clientHeight) * 2 + 1;
      isHovered = true;
    } else {
      mouse.set(-9999, -9999); // 移到極遠處以防誤觸發
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

  // 11. 動畫渲染迴圈 (Physics Update & Render)
  const tempPos = new THREE.Vector3();
  let themeUpdateTimer = 0;

  const tick = () => {
    // 物理引擎更新：射線檢測
    if (isHovered) {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(interactMesh);
      // 若射線有穿過隱形包圍盒，觸發爆裂
      var isExploding = intersects.length > 0;
    } else {
      var isExploding = false;
    }

    const positionsArray = positionAttribute.array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      tempPos.set(positionsArray[i3], positionsArray[i3 + 1], positionsArray[i3 + 2]);

      if (isExploding) {
        // 爆炸狀態：當前座標朝目標位置(原始位置 + 爆炸速度向量 * 爆炸強度)飛行
        // 設計了「爆炸目標點」，可避免粒子無限制飛散至視窗外
        const target = originalPositions[i].clone().addScaledVector(velocities[i], explosionStrength);
        tempPos.lerp(target, 0.12); // 爆炸時以 0.12 係數快速飛散，產生強烈爆裂感
      } else {
        // 收回狀態：粒子以 0.04 的較低係數緩慢、平滑且有磁力凝聚感地收回正方體
        tempPos.lerp(originalPositions[i], 0.04);
      }

      positionsArray[i3] = tempPos.x;
      positionsArray[i3 + 1] = tempPos.y;
      positionsArray[i3 + 2] = tempPos.z;
    }

    // 關鍵：標記頂點屬性需要更新，Three.js 才會重新繪製
    positionAttribute.needsUpdate = true;

    // 粒子星團的微幅自轉，提供流暢 of 動態美感
    points.rotation.y += 0.0015;
    points.rotation.x += 0.0005;

    // 同步隱形 Mesh 的旋轉，使其與粒子完全契合
    interactMesh.rotation.y = points.rotation.y;
    interactMesh.rotation.x = points.rotation.x;

    // 每 30 幀動態同步一次主題顏色，減少 CPU 負擔
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
});
