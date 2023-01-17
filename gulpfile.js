// Modules

const gulp = require('gulp');
const path = require('path');
const webpackStream = require('webpack-stream');
const vinylNamed = require('vinyl-named');
const gulpIf = require('gulp-if');
const browserSync = require('browser-sync').create();
const del = require('del');
const sourcemaps = require('gulp-sourcemaps');
const scss = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const groupCssMedia = require('gulp-group-css-media-queries');
const cleanCss = require('gulp-clean-css');
const rename = require('gulp-rename');
const pug = require('gulp-pug');
// const formatHtml = require('gulp-format-html');

// Constants
const DIR_SRC = path.resolve(__dirname, 'src');
const DIR_BUILD = path.resolve(__dirname, 'build');
const DIR_DIST = path.resolve(__dirname, 'build');
const MODE = process.env.MODE || 'development';

let DIR_DESTINATION = DIR_BUILD;

switch (MODE) {
  case 'production':
    DIR_DESTINATION = DIR_DIST;
    break;
  case 'development':
  default:
    DIR_DESTINATION = DIR_BUILD;
    break;
}

const clean = () => {
  return del(DIR_DESTINATION + '/*');
};

const watching = () => {
  gulp.watch([DIR_SRC + '/**/*.js'], { usePolling: true }, buildJs);
  gulp.watch([DIR_SRC + '/**/*.scss'], { usePolling: true }, buildCss);
  gulp.watch([DIR_SRC + '/**/*.{png,jpg,gif,ico,svg,webp}'], { usePolling: true }, buildImages);
  gulp.watch([DIR_SRC + '/**/*.pug'], { usePolling: true }, buildPug);
  gulp.watch([DIR_SRC + '/**/*.{woff,woff2}'], { usePolling: true }, buildFonts);
};

const browser = () => {
  browserSync.init({
    server: {
      baseDir: DIR_BUILD,
      index: '/index.html'
    },
    open: false
  });
};

const compileCss = (src, dest) => {
  return gulp.src(src)
    .pipe(gulpIf(MODE === 'development', sourcemaps.init()))
    .pipe(scss({ outputStyle: 'compressed' }).on('error', scss.logError))
    .pipe(autoprefixer({ cascade: false }))
    .pipe(groupCssMedia())
    .pipe(cleanCss({
      compatibility: {
        selectors: {
          mergeablePseudoClasses: [':root'],
        },
      },
      level: {
        2: {
          restructureRules: true,
        }
      }
    }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulpIf(MODE === 'development', sourcemaps.write('/')))
    .pipe(gulp.dest(dest))
    .pipe(browserSync.stream());
};

const compileJs = (src, dest) => {
  return gulp.src(src)
    .pipe(vinylNamed())
    .pipe(webpackStream(require('./webpack.config.js')))
    .pipe(gulp.dest(dest))
    .pipe(browserSync.stream());
};

const buildCss = () => {
  let stream = require('merge-stream')();

  stream.add(compileCss(path.resolve(DIR_SRC, 'scss', 'main.scss'), path.resolve(DIR_DESTINATION, 'css')));

  return stream.isEmpty() ? null : stream;
};

const buildJs = () => {
  let stream = require('merge-stream')();

  stream.add(compileJs(path.resolve(DIR_SRC, 'js', 'main.js'), path.resolve(DIR_DESTINATION, 'js')));

  return stream.isEmpty() ? null : stream;
};

const buildFonts = () => {
  return gulp.src([`${DIR_SRC}/**/*.{woff, woff2}`])
    .pipe(gulp.dest(DIR_DESTINATION))
    .pipe(browserSync.stream());
};

const buildImages = () => {
  return gulp.src([`${DIR_SRC}/**/*.{ png, jpg, gif, ico, svg, webp }`])
    .pipe(gulp.dest(DIR_DESTINATION))
    .pipe(browserSync.stream());
};

const buildPug = () => {
  return gulp.src([`${DIR_SRC}/**/*.pug`, `!${DIR_SRC}/**/_*.pug`])
    .pipe(pug())
    // .pipe(formatHtml({
    //   indent_with_tabs: true
    // }))
    .pipe(gulp.dest(DIR_DESTINATION))
    .pipe(browserSync.stream());
};

// Exports
exports.default = gulp.series(
  clean,
  gulp.parallel(
    buildCss,
    buildJs,
    buildImages,
    buildPug,
    buildFonts
  ),
);

exports.start = gulp.parallel(
  gulp.series(
    clean,
    gulp.parallel(
      buildCss,
      buildJs,
      buildImages,
      buildPug,
      buildFonts
    ),
  ),
  watching,
  browser
);