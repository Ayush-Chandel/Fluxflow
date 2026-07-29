import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { localApiRoutes } from './vite/localApi'


export default defineConfig({
  plugins: [react(), tailwindcss(), localApiRoutes()],
  resolve: {
    tsconfigPaths: true,  
  },
})