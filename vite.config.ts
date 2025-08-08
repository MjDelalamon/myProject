import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/myProject/', // must match your repo name
  plugins: [react()]
})
