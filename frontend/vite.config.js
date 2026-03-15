import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'https://3zpc16efh3.execute-api.us-east-1.amazonaws.com'
    }
  }
});
