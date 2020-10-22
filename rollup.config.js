// rollup index.js --file dist/webfx.js --format umd --name webfx --context this
import { terser } from "rollup-plugin-terser";
import sourcemaps from 'rollup-plugin-sourcemaps';

var pkgVersion = require('./package.json').version;


function transformSourcemapPath() {
    return (rel, path) => {
        rel = rel.replace(/\\/g, '/');
        rel = rel.replace(/^\.\.\//, '');
        if (rel.startsWith('node_modules')) {
            var mat = rel.match(/^node_modules\/((?:@[\w\-_]+\/)?[\w\-_]+)\/(.*)$/);
            if (!mat) {
                console.warn(['sourcemapPathTransform', rel]);
            }
            var version = require(mat[1] + '/package.json').version;
            return `https://cdn.jsdelivr.net/npm/${mat[1]}@${version}/${mat[2]}`;
        }
        return `https://github.com/lideming/webfx/raw/v${pkgVersion}/${rel}`;
    };
}

function myCss() {
    return {
        name: 'my-css-loader',
        /** @param {string} code */
        transform(code, id) {
            if (id.endsWith('.css')) {
                code = code.replace(/\r?\n[ \t]*/g, '');
                return {
                    code: 'export default ' + JSON.stringify(code),
                    map: { mappings: '' }
                };
            }
        }
    };
}

export default [{
    input: 'index.js',
    output: [
        {
            file: 'dist/webfx.js',
            format: 'umd',
            name: 'webfx'
        }, {
            file: 'dist/webfx.esm.js',
            format: 'es',
            name: 'webfx'
        }, {
            file: 'dist/webfx.min.js',
            format: 'umd',
            name: 'webfx',
            sourcemap: true,
            sourcemapPathTransform: transformSourcemapPath(),
            plugins: [terser()]
        }
    ],
    plugins: [
        sourcemaps(),
        myCss()
    ],
    context: 'this'
}, {
    input: 'lib/webfxcore.js',
    output: [
        {
            file: 'dist/webfxcore.min.js',
            format: 'umd',
            name: 'utils',
            sourcemap: true,
            sourcemapPathTransform: transformSourcemapPath(),
            plugins: [terser()]
        }
    ],
    plugins: [
        sourcemaps()
    ],
    context: 'this'
}];
