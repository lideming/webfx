// rollup index.js --file dist/webfx.js --format umd --name webfx --context this
import { terser } from "rollup-plugin-terser";
import sourcemaps from 'rollup-plugin-sourcemaps';
import resolve from '@rollup/plugin-node-resolve';

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

function myText() {
    function match(id) {
        return /\.(css|svg)$/.test(id);
    }
    return {
        name: 'my-text-loader',
        transform(code, id) {
            if (match(id)) {
                return {
                    code: 'export default ' + JSON.stringify(code),
                    map: { mappings: '' }
                };
            }
        }
    };
}

function myVersion() {
    return {
        name: "version",
        resolveId(src) {
            if (src === './version') {
                return src;
            }
            return null;
        },
        load(id) {
            if (id === './version') {
                return `export const version = ${JSON.stringify(require("./package.json").version)}`;
            }
            return null;
        }
    };
}

/** @type {import("rollup").RollupOptions} */
export default [{
    input: 'build/index.js',
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
        resolve(),
        myVersion(),
        myText(),
    ],
    context: 'this'
}, {
    input: 'build/webfxcore.js',
    output: [
        {
            file: 'dist/webfxcore.min.js',
            format: 'umd',
            name: 'webfx',
            sourcemap: true,
            sourcemapPathTransform: transformSourcemapPath(),
            plugins: [terser()]
        },
        {
            file: 'dist/webfxcore.min.esm.js',
            format: 'es',
            name: 'webfx',
            sourcemap: true,
            sourcemapPathTransform: transformSourcemapPath(),
            plugins: [terser()]
        },
    ],
    plugins: [
        sourcemaps(),
        resolve(),
        myVersion(),
    ],
    context: 'this'
}];
