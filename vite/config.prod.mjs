import { defineConfig } from 'vite';
import { realpathSync } from 'node:fs';

const root = realpathSync(process.cwd());

export default defineConfig({
    base: './',
    root,
    logLevel: 'warning',
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        },
        minify: 'terser',
        terserOptions: {
            compress: {
                passes: 2
            },
            mangle: true,
            format: {
                comments: false
            }
        }
    },
    server: {
        port: 8080
    }
});
