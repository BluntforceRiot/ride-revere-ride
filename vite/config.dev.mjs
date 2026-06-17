import { defineConfig } from 'vite';
import { realpathSync } from 'node:fs';

const root = realpathSync(process.cwd());

export default defineConfig({
    base: './',
    root,
    optimizeDeps: {
        noDiscovery: true,
        include: []
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        },
    },
    server: {
        port: 8080
    }
});
