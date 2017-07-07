import gulp from 'gulp';
import babel from 'gulp-babel';
import eslint from 'gulp-eslint';
import notify from 'gulp-notify';
import plumber from 'gulp-plumber';
import sourcemaps from 'gulp-sourcemaps';
import runSequence from 'run-sequence';
import webpack from 'webpack-stream';
import del from 'del';
import webpackConfig from './webpack.config';

gulp.task('clean', () =>
  del([
    'lib',
  ]),
);

gulp.task('lint', () =>
  gulp
    .src([
      'src/**/*.js',
      '!node_modules/**',
    ])
    .pipe(eslint())
    .pipe(eslint.format('node_modules/eslint-formatter-pretty'))
    .pipe(eslint.failAfterError()),
);

gulp.task('build', () =>
  gulp
    .src(['src/**/*.js', '!src/client/**'])
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: ['es2015'],
      plugins: ['transform-runtime'],
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('lib')),
);

// The client side part of this lib is built using Webpack through gulp.
gulp.task('build-client', () =>
  gulp
    .src(['src/client/league-tips.js'])
    .pipe(plumber({ errorHandler: notify.onError('Error: <%= error.message %>') }))
    .pipe(webpack(webpackConfig), null, (err, stats) => {
      if (stats.compilation.errors.length > 0) {
        notify({
          title: 'Webpack error',
          message: stats.compilation.errors[0].error,
        });
      }
    })
    .pipe(gulp.dest('lib/client')),
);

gulp.task('default', (callback) => {
  runSequence(
    'clean',
    'lint',
    'build',
    'build-client',
    callback,
  );
});
