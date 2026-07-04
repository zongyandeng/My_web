import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

/**
 * Edison.Dev - Three.js 3D 幾何體測試實驗室
 * 實作內容包含：
 * 1. 響應式容器適應 (根據父層 #three-container 的尺寸自動縮放畫布)
 * 2. 3D 場景、透視相機、WebGL 渲染器初始化
 * 3. 旋轉正方體 (標準金屬材質 MeshStandardMaterial)
 * 4. 環境光與平行光設置 (打出立體明暗面)
 * 5. 滑鼠拖曳互動 (OrbitControls，關閉 Zoom 以防干擾網頁滾動)
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. 取得 DOM 容器與 Canvas 節點
  const container = document.getElementById('three-container');
  const canvas = document.getElementById('webgl-canvas');

  // 防錯機制：若目前頁面不包含此 3D 容器，則直接退出
  if (!container || !canvas) return;

  // 2. 初始化場景 (Scene)
  const scene = new THREE.Scene();

  // 3. 取得父容器目前的寬高
  let width = container.clientWidth;
  let height = container.clientHeight;

  // 4. 初始化透視相機 (Perspective Camera)
  // 參數：視野夾角 (fov), 長寬比 (aspect), 近剪裁面 (near), 遠剪裁面 (far)
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0, 5); // 將相機朝外拉 5 個單位
  scene.add(camera);

  // 5. 初始化 WebGL 渲染器 (Renderer)
  const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true, // 啟用抗鋸齒
    alpha: true,     // 啟用透明背景，以便透出網頁底層流光
  });
  renderer.setSize(width, height);
  // 限制像素比率最大為 2，避免在高解析度螢幕 (Retina) 上耗費過多 GPU 效能
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // 6. 建立 3D 正方體 (Cube)
  // 幾何體 (BoxGeometry) 尺寸：長、寬、高皆為 1.5 單位
  const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
  
  // 標準金屬感材質 (MeshStandardMaterial)
  const material = new THREE.MeshStandardMaterial({
    color: 0x3b82f6,      // 經典科技藍
    roughness: 0.25,      // 粗糙度 0.25 (稍微光滑，能反射亮光)
    metalness: 0.8,       // 金屬感 0.8
  });
  
  // 網格物體 (Mesh)
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // 7. 燈光設置 (Lighting)
  // 環境光 (AmbientLight)：提供溫和的基礎全域光，避免背光面全黑
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  // 平行光 (DirectionalLight)：模擬太陽光，打出物體的立體亮暗面與陰影
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
  dirLight.position.set(5, 5, 5); // 由右上方斜射
  scene.add(dirLight);

  // 8. 軌道控制 (OrbitControls)
  // 讓使用者可以用滑鼠點擊拖曳來旋轉視角
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;   // 啟用阻尼 (物理滑動緩衝感)
  controls.dampingFactor = 0.05;
  controls.enableZoom = false;     // 關鍵：關閉縮放，避免干擾網頁原本的滾動條
  controls.enablePan = false;      // 關閉右鍵平移，讓正方體始終保持在中心

  // 9. 監聽響應式視窗大小調整 (Resize Event)
  window.addEventListener('resize', () => {
    // 重新抓取父容器最新的寬高
    width = container.clientWidth;
    height = container.clientHeight;

    // 更新相機長寬比與投影矩陣
    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // 更新渲染器尺寸與像素比
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  });

  // 10. 動畫渲染迴圈 (RequestAnimationFrame Loop)
  const tick = () => {
    // 讓正方體在每一幀都產生微小的自轉，製造動態感
    cube.rotation.x += 0.005;
    cube.rotation.y += 0.005;

    // 每一幀都必須更新 OrbitControls
    controls.update();

    // 執行渲染
    renderer.render(scene, camera);

    // 遞迴請求下一影格
    window.requestAnimationFrame(tick);
  };

  // 啟動動畫迴圈
  tick();
});
