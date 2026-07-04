import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
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
