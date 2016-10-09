import gulp from 'gulp';
import babel from 'gulp-babel';
import eslint from 'gulp-eslint';
import notify from 'gulp-notify';
import plumber from 'gulp-plumber';
import rename from 'gulp-rename';
import sourcemaps from 'gulp-sourcemaps';
import runSequence from 'run-sequence';
import uglify from 'gulp-uglify';
import webpack from 'webpack-stream';
import del from 'del';

gulp.task('clean', () => {
  return del([
    'lib'
  ]);
});

gulp.task('lint', () => {
return gulp
  .src([
    'src/**/*.js',
    '!node_modules/**'
  ])
  .pipe(eslint())
  .pipe(eslint.format('node_modules/eslint-formatter-pretty'))
  .pipe(eslint.failAfterError());
});

gulp.task('build', () => {
  return gulp.src(['src/**/*.js', '!src/client/**'])
  .pipe(sourcemaps.init())
  .pipe(babel({
    presets: ['es2015'],
    plugins: ['transform-runtime']
  }))
  .pipe(sourcemaps.write())
  .pipe(gulp.dest('lib'));
});

// The client side part of this lib is built using Webpack through gulp.
gulp.task('build-client', () => {
  return gulp.src(['src/client/league-tips.js'])
  .pipe(plumber({ errorHandler: notify.onError('Error: <%= error.message %>') }))
  .pipe(webpack(require('./webpack.config.js')), null, (err, stats) => {
    if (stats.compilation.errors.length > 0) {
      notify({
        title: 'Webpack error',
        message: stats.compilation.errors[0].error
      });
    }
  })
  .pipe(gulp.dest('lib/client'));
});

gulp.task('default', (callback) => {
  runSequence(
    'clean',
    'lint',
    'build',
    'build-client',
    callback
  );
});
