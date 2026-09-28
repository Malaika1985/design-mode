import { defineConfig } from 'vite';
import designMode from 'design-mode/vite';

export default defineConfig({
  plugins: [designMode({ lang: 'auto' })],
});
