import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Uncomment and set your API Gateway URL for local development:
  // server: {
  //   proxy: {
  //     '/api': 'https://YOUR_API_GATEWAY_URL'
  //   }
  // }
});
