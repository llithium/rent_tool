import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // Pin the serverless runtime so builds work regardless of the local Node version.
    adapter: adapter({ runtime: 'nodejs22.x' })
  }
};

export default config;
