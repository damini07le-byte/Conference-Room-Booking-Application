import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react({
            future: {
                v7_fetcherPersist: true,
                v7_relativeSplatPath: true,
                v7_startTransition: true,
            },
        }),
    ],
    esbuild: {
        logOverride: { 'this-is-undefined-in-esm': 'silent' }
    },
    optimizeDeps: {
        esbuildOptions: {
            target: 'esnext'
        }
    }
})
