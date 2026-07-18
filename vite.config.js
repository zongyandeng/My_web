import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
      
      // 複製助理 CSS 檔
      try {
        fs.copyFileSync(resolve(__dirname, 'src/assistant.css'), resolve(__dirname, 'dist/src/assistant.css'));
        console.log('Successfully copied src/data, src/img, and src/assistant.css to dist/src/');
      } catch (err) {
        console.error('Failed to copy src/assistant.css:', err);
      }
    }
  };
}

export default defineConfig({
  base: './', // 確保打包後的資源路徑為相對路徑，以支援 GitHub Pages 等部署
  plugins: [copyStaticFiles()],
  server: {
    allowedHosts: ['watercolor.dev.local']
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        profile: resolve(__dirname, 'profile.html'),
        ai: resolve(__dirname, 'ai-learning.html'),
        hardware: resolve(__dirname, 'hardware.html'),
        network: resolve(__dirname, 'network-learning.html'),
        commands: resolve(__dirname, 'commands.html'),
      },
    },
  },
});
