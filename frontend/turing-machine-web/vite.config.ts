import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
	server: {
		proxy: {
			"/api": "http://turingmachine.server.legendsofsky.com"
		}
	}
})
