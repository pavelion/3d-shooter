import { defineConfig } from 'vite';

export default defineConfig({
  base: '/3d-shooter/',
  root: '.',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
server: {
    allowedHosts: ['ps-macbook.local']
}
});
