import { defineConfig } from 'vite';
import designMode from '@malaika1985/design-mode/vite';

export default defineConfig({
  plugins: [designMode({ lang: 'auto' })],
});
