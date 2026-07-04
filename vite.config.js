import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './', // 確保打包後的資源路徑為相對路徑，以支援 GitHub Pages 等部署
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
