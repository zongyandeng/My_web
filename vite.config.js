import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

// 自訂靜態資源複製插件
function copyStaticFiles() {
  return {
    name: 'copy-static-files',
    closeBundle() {
      // 確保目標資料夾存在
      fs.mkdirSync(resolve(__dirname, 'dist/src/data'), { recursive: true });
      fs.mkdirSync(resolve(__dirname, 'dist/src/img'), { recursive: true });
      
      // 複製檔案
      fs.cpSync(resolve(__dirname, 'src/data'), resolve(__dirname, 'dist/src/data'), { recursive: true });
      fs.cpSync(resolve(__dirname, 'src/img'), resolve(__dirname, 'dist/src/img'), { recursive: true });
      console.log('Successfully copied src/data and src/img to dist/src/');
    }
  };
}

export default defineConfig({
  base: './', // 確保打包後的資源路徑為相對路徑，以支援 GitHub Pages 等部署
  plugins: [copyStaticFiles()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        profile: resolve(__dirname, 'profile.html'),
        ai: resolve(__dirname, 'ai-learning.html'),
        hardware: resolve(__dirname, 'hardware.html'),
        commands: resolve(__dirname, 'commands.html'),
      },
    },
  },
});
