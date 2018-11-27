"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const i18next_scanner_1 = __importDefault(require("i18next-scanner"));
const vinyl_fs_1 = __importDefault(require("vinyl-fs"));
// interface Options {
//   include?: string;
//   exclude?: string;
//   dest?: string;
// }
class I18NextExtractorPlugin {
    constructor(options = {}) {
        this.options = {
            include: null,
            exclude: null,
            dest: 'dist'
        };
        this.pluginName = 'i18next-extractor-plugin';
        this.options = Object.assign({}, this.options, options);
    }
    parseLocales(paths = []) {
        const { options } = this;
        return new Promise(resolve => {
            const stream = vinyl_fs_1.default
                .src(paths, { resolveSymlinks: true })
                // .pipe(sort()) // Sort files in stream by path
                .pipe(i18next_scanner_1.default(options))
                .pipe(vinyl_fs_1.default.dest(options.dest));
            stream.on('end', () => resolve());
        });
    }
    apply(compiler) {
        const { options } = this;
        if (!compiler) {
            console.error(this.pluginName, "apply() didn't get any compiler parameter", compiler);
        }
        if (!compiler.hooks) {
            console.error(this.pluginName, 'apply(compiler) hook not found', compiler);
        }
        compiler.hooks.emit.tapAsync(this.pluginName, (compilation, callback) => __awaiter(this, void 0, void 0, function* () {
            let sources = compilation.modules
                .filter((module) => {
                if (module.resource) {
                    let conditions = true;
                    if (options.include) {
                        conditions = !!module.resource.match(options.include);
                    }
                    if (options.exclude) {
                        conditions = !module.resource.match(options.exclude);
                    }
                    return conditions;
                }
                return false;
            })
                .map((module) => module.resource);
            try {
                yield this.parseLocales(sources);
                return callback();
            }
            catch (error) {
                return callback(error);
            }
        }));
    }
}
exports.default = I18NextExtractorPlugin;
