// --- 首頁 3D 卡片傾斜效果 (3D Tilt Effect) ---
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.menu-card');

  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const cardRect = card.getBoundingClientRect();
      const cardWidth = cardRect.width;
      const cardHeight = cardRect.height;

      // 取得滑鼠在卡片內的相對位置 (從中心點計算)
      const mouseX = e.clientX - cardRect.left - cardWidth / 2;
      const mouseY = e.clientY - cardRect.top - cardHeight / 2;

      // 計算傾斜角度 (最大旋轉 15 度)
      const maxRotate = 15;
      const rotateX = -(mouseY / (cardHeight / 2)) * maxRotate;
      const rotateY = (mouseX / (cardWidth / 2)) * maxRotate;

      // 應用 3D 變形
      card.style.transform = `rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(10px)`;
    });

    card.addEventListener('mouseleave', () => {
      // 滑鼠移開後平滑復原
      card.style.transition = 'transform 0.5s ease';
      card.style.transform = 'rotateX(0deg) rotateY(0deg) translateZ(0deg)';
    });

    card.addEventListener('mouseenter', () => {
      // 滑鼠移入時移除 transition，避免滑鼠滑動時卡頓
      card.style.transition = 'none';
    });
  });
});
