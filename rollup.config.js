// rollup index.js --file dist/webfx.js --format umd --name webfx --context this
import { terser } from "rollup-plugin-terser";
export default {
    input: 'index.js',
    output: [
        {
            file: 'dist/webfx.js',
            format: 'umd',
            name: 'webfx'
        }, {
            file: 'dist/webfx.min.js',
            format: 'umd',
            name: 'webfx',
            sourcemap: true,
            plugins: [terser()]
        }
    ],
    context: 'this'
};
