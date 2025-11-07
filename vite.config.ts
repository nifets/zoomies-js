import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/index.ts',
            name: 'Zoomies',
            formats: ['es', 'umd'],
            fileName: (format: string) => `index.${format === 'es' ? 'esm' : 'umd'}.js`
        }
    },
    server: {
        open: '/demo.html'
    }
});
