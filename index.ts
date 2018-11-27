import scanner from 'i18next-scanner';
import vfs from 'vinyl-fs';

// interface Options {
//   include?: string;
//   exclude?: string;
//   dest?: string;
// }

export default class I18NextExtractorPlugin {
  options = {
    include: null,
    exclude: null,
    dest: 'dist'
  };
  pluginName = 'i18next-extractor-plugin';

  constructor(options = {}) {
    this.options = {
      ...this.options,
      ...options
    };
  }

  parseLocales(paths = []) {
    const { options } = this;
    return new Promise(resolve => {
      const stream = vfs
        .src(paths, { resolveSymlinks: true })
        // .pipe(sort()) // Sort files in stream by path
        .pipe(scanner(options))
        .pipe(vfs.dest(options.dest));

      stream.on('end', () => resolve());
    });
  }

  apply(compiler: any) {
    const { options } = this;
    if (!compiler) {
      console.error(
        this.pluginName,
        "apply() didn't get any compiler parameter",
        compiler
      );
    }
    if (!compiler.hooks) {
      console.error(
        this.pluginName,
        'apply(compiler) hook not found',
        compiler
      );
    }
    compiler.hooks.emit.tapAsync(
      this.pluginName,
      async (compilation: any, callback: any) => {
        let sources = compilation.modules
          .filter((module: any) => {
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
          .map((module: any) => module.resource);
        try {
          await this.parseLocales(sources);
          return callback();
        } catch (error) {
          return callback(error);
        }
      }
    );
  }
}
