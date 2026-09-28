import { defineConfig } from 'vite';
import designMode from '@mailaika1985/design-mode/vite';

export default defineConfig({
  plugins: [designMode({ lang: 'auto' })],
});
