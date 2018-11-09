const scanner = require('i18next-scanner');
const vfs = require('vinyl-fs');

module.exports = class I18NextExtractorPlugin {
  constructor(options = {}) {
    this.pluginName = 'i18next-extractor-plugin';
    this.options = {
      include: null,
      exclude: null,
      dest: 'dist',
      ...options
    };
  }

  parseLocales(paths = []) {
    const { options } = this;
    return new Promise((resolve, reject) => {
      const stream = vfs
        .src(paths, { resolveSymlinks: true })
        // .pipe(sort()) // Sort files in stream by path
        .pipe(scanner(options))
        .pipe(vfs.dest(options.dest));

      stream.on('end', () => resolve());
    });
  }

  apply(compiler) {
    const { options } = this;
    compiler.hooks.emit.tapAsync(
      this.pluginName,
      async (compilation, callback) => {
        let sources = compilation.modules
          .filter(module => {
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
          .map(module => module.resource);
        try {
          await this.parseLocales(sources);
          return callback();
        } catch (error) {
          return callback(error);
        }
      }
    );
  }
};
