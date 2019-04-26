'use strict';

const fs = require('fs');
const path = require('path');

const gulp = require('gulp');
const server = require('browser-sync').create();
const plumber = require('gulp-plumber');
const gulpIf = require('gulp-if');
const newer = require('gulp-newer');
const del = require('del');
const rename = require('gulp-rename');
const svgSprite = require('gulp-svg-sprite');

const sourcemap = require('gulp-sourcemaps');
const less = require('gulp-less');

const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('gulp-cssnano');
const objectFitImages = require('postcss-object-fit-images');

const babel = require("gulp-babel");
const uglify = require('gulp-uglify');
const concat = require("gulp-concat");

const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

gulp.task('clean', () => {
  return del(['build']);
});

gulp.task('html', () => {
  return gulp
    .src('source/*.html')
    .pipe(gulp.dest('build'));
});

gulp.task('copy:img', () => {
  return gulp
    .src('source/img/*.{jpg,svg,png}')
    .pipe(newer('build/img'))
    .pipe(gulp.dest('build/img'))
    .pipe(server.stream());
});

gulp.task('copy:fonts', () => {
  return gulp
    .src('source/fonts/*.{woff,woff2}')
    .pipe(newer('build/fonts'))
    .pipe(gulp.dest('build/fonts'));
});

gulp.task('css', () => {
  return gulp.src('source/less/style.less')
    .pipe(plumber())
    .pipe(gulpIf(isDevelopment, sourcemap.init()))
    .pipe(less())
    .pipe(postcss([
      autoprefixer(),
      objectFitImages()
    ]))
    .pipe(gulpIf(!isDevelopment, cssnano()))
    .pipe(gulpIf(isDevelopment, sourcemap.write('.')))
    .pipe(gulp.dest('build/css'))
    .pipe(server.stream());
});

gulp.task('js', function () {
  return gulp.src('source/js/*.js')
    .pipe(gulpIf(isDevelopment, sourcemap.init()))
    .pipe(babel())
    .pipe(gulpIf(isDevelopment, sourcemap.write('.')))
    .pipe(gulpIf(!isDevelopment, uglify()))
    .pipe(gulp.dest('build/js'));
});

gulp.task('js:vendors', () => {
  return gulp.src([
    './node_modules/object-fit-images/dist/ofi.js',
    './node_modules/svg4everybody/dist/svg4everybody.js',
    './node_modules/picturefill/dist/picturefill.js'
  ])
    .pipe(concat('vendors.js'))
    .pipe(gulpIf(!isDevelopment, uglify()))
    .pipe(gulp.dest('build/js'));
});

gulp.task('sprite', () => {
    return gulp
      .src('source/sprite-svg/*.svg')
      .pipe(
        svgSprite({
          svg: {
            doctypeDeclaration: false,
            xmlDeclaration: false
          },
          shape: {
            dimension: {
              maxWidth: 32,
              maxHeight: 32
            },
            transform: [
              {
                svgo: {
                  plugins: [
                    { transformsWithOnePath: true },
                    { moveGroupAttrsToElems: false },
                  ]
                }
              }
            ]
          },
          mode: {
            symbol: {
              bust: false,
              dest: '.'
            }
          }
        })
      )
      .pipe(rename('sprite.svg'))
      .pipe(gulp.dest('build/img'))
});

gulp.task('watch', () => {
  gulp.watch('source/less/**/*.less', gulp.series('css'));
  gulp.watch('source/*.html', gulp.series('html'));
  gulp.watch('source/js/**/*.js', gulp.series('js'));
  gulp.watch('source/img/**/*.{jpg,svg,png}', gulp.series('copy:img'));
  gulp.watch('source/fonts/*.{woff,woff2}', gulp.series('copy:fonts'));
});

gulp.task('server', () => {
  server.init({
    files: ['./source'],
    watch: isDevelopment ? true : false,
    watchOptions: {
      ignored: './node_modules',
      ignoreInitial: true,
    },
    server: './build',
    startPath: 'index.html',
    open: true,
    reloadOnRestart: true,
    notify: true,
    cors: true,
    ui: false,
  });
});

gulp.task(
  'build',
  gulp.series([
    gulp.parallel([
      'clean'
    ]),
    gulp.parallel([
      'copy:img',
      'copy:fonts',
      'sprite',
      'css',
      'js',
      'js:vendors'
    ]),
    gulp.parallel([
      'html'
    ])
  ])
);

gulp.task('development', gulp.series([
  'build',
  gulp.parallel([
    'server',
    'watch'
  ]),
]),);

gulp.task('default', gulp.series('development'));
