var bower = require('bower');
var concat = require('gulp-concat');
var clean = require('gulp-clean');
var gulp = require('gulp');
var gutil = require('gulp-util');
var imageMin = require('gulp-imagemin');
var livereload = require('gulp-livereload');
var minifyCss = require('gulp-minify-css');
var ngAnnotate = require('gulp-ng-annotate');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var sh = require('shelljs');
var templateCache = require('gulp-angular-templatecache');
var uglify = require("gulp-uglify");

var paths = {
  css: ['./www/css/**/*.min.css'],
  dist: ['./www/dist/'],
  html: ['./www/index.html'],
  ionicBundle: ['./www/lib/ionic/js/ionic.bundle.min.js'],
  ionicFonts: ['./www/lib/ionic/fonts/*'],
  images: ['./www/img/**/*'],
  lib: [
    './www/lib/firebase/firebase.js',
    './www/lib/geofire/dist/geofire.min.js',
    './www/lib/ionic-image-lazy-load/ionic-image-lazy-load.js',
    './www/lib/moment/min/moment.min.js',
    './www/lib/ngCordova/dist/ng-cordova.min.js',
    './www/lib/ionic-native-transitions/dist/ionic-native-transitions.min.js',
    './www/lib/angular-uuids/angular-uuid.js'
  ],
  sass: ['./scss/**/*.scss'],
  scripts: ['./www/js/**/*.js', '!./www/js/app.bundle.min.js'],
  templates: ['./www/templates/**/*.html'],
  unminifiedCss: ['./www/css/**/*.css', '!./www/css/**/*.min.css']
};

var files = {
  jsBundle: 'app.bundle.min.js'
};

gulp.task('build', ['sass', 'scripts', 'styles', 'copy']);

gulp.task('clean', function () {
  return gulp.src(paths.dist, {
    read: false
  })
    .pipe(clean());
});

gulp.task('copy', ['clean'], function () {
  // Copy ionic bundle file
  gulp.src(paths.ionicBundle)
    .pipe(gulp.dest(paths.dist + 'lib/ionic/js/.'));

  gulp.src(paths.ionicFonts)
    .pipe(gulp.dest(paths.dist + 'lib/ionic/fonts'));

  // Copy lib scripts
  gulp.src(paths.lib)
    .pipe(gulp.dest(paths.dist + 'lib'));
});

gulp.task('default', ['build']);

gulp.task('git-check', function (done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});

var imageMinTask = function () {
  return gulp.src(paths.images)
    .pipe(imageMin())
    .pipe(gulp.dest(paths.dist + 'img'))
    .pipe(livereload());
};
gulp.task('imageMin', ['clean'], imageMinTask);
gulp.task('imageMin-watch', [], imageMinTask);

gulp.task('install', ['git-check'], function () {
  return bower.commands.install()
    .on('log', function (data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('minifyCss', function () {
  return gulp.src(paths.unminifiedCss)
    .pipe(minifyCss())
    .pipe(rename({
      extname: '.min.css'
    }))
    .pipe(gulp.dest('./www/css/'))
    .pipe(livereload());
});

gulp.task('sass', function (done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({extname: '.min.css'}))
    .pipe(gulp.dest('./www/css/'))
    .pipe(livereload())
    .on('end', done);
});

var scriptsTask = function () {
  return gulp.src(paths.scripts)
    .pipe(ngAnnotate({
      remove: true,
      add: true,
      single_quotes: true
    }).on('error', gutil.log))
    .pipe(uglify().on('error', gutil.log))
    .pipe(concat(files.jsBundle))
    .pipe(gulp.dest(paths.dist + 'js'))
    .pipe(livereload());
};
gulp.task('scripts', ['clean', 'templateCache'], scriptsTask);
gulp.task('scripts-watch', ['templateCache-watch'], scriptsTask);

var stylesTask = function () {
  return gulp.src(paths.css)
    .pipe(gulp.dest(paths.dist + 'css'))
    .pipe(livereload());
};
gulp.task('styles', ['clean', 'minifyCss'], stylesTask);
gulp.task('styles-watch', ['minifyCss'], stylesTask);

var templateCacheTask = function () {
  return gulp.src(paths.templates)
    .pipe(templateCache({
      'filename': 'templates.js',
      'root': 'templates/',
      'module': 'app'
    }))
    .pipe(gulp.dest('./www/js'))
    .pipe(livereload());
};
gulp.task('templateCache', ['clean'], templateCacheTask);
gulp.task('templateCache-watch', templateCacheTask);

gulp.task('watch', function () {
  livereload.listen();
  gulp.watch(paths.html, ['templateCache-watch']);
  gulp.watch(paths.sass, ['sass']);
  gulp.watch(paths.css, ['styles-watch']);
  gulp.watch(paths.scripts, ['scripts-watch']);
  gulp.watch(paths.templates, ['templateCache-watch']);
  gulp.watch(paths.images, ['imageMin-watch']);
});


