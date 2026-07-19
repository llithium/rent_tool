import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    csp: {
      mode: 'auto',
      directives: {
        'default-src': ['self'],
        'script-src': ['self'],
        'style-src': ['self', 'unsafe-inline'],
        'img-src': ['self', 'data:', 'https://*.tile.openstreetmap.org'],
        'connect-src': ['self', 'ws:', 'wss:'],
        'font-src': ['self'],
        'object-src': ['none'],
        'base-uri': ['self'],
        'frame-ancestors': ['none'],
        'form-action': ['self']
      }
    },
    // Pin the serverless runtime so builds work regardless of the local Node version.
    adapter: adapter({ runtime: 'nodejs22.x' })
  }
};

export default config;
