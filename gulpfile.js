var gulp = require('gulp');
var gutil = require('gulp-util');
var htmlReplace = require('gulp-html-replace');
var bower = require('bower');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var imageMin = require('gulp-imagemin');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sh = require('shelljs');

var paths = {
  css: ['./www/css/**/*.min.css'],
  html: ['./www/index.html'],
  ionicBundle: ['./www/lib/ionic/js/ionic.bundle.min.js'],
  images: ['./www/img/**/*'],
  lib: [
    './www/lib/firebase/firebase.js',
    './www/lib/angularfire/dist/angularfire.js',
    './www/lib/geofire/dist/geofire.min.js',
    './www/lib/ngCordova/dist/ng-cordova.min.js',
    './www/lib/ionic-toast/dist/ionic-toast.bundle.min.js',
    './www/lib/moment/min/moment.min.js'
  ],
  sass: ['./scss/**/*.scss'],
  scripts: ['./www/js/**/*.js', '!./www/js/app.bundle.min.js'],
  templates: ['./www/templates/**/*.html']
};

var files = {
  jsBundle: 'app.bundle.min.js',
  appCss: 'app.css'
};

gulp.task('default', ['build']);

gulp.task('build', ['sass', 'scripts', 'styles', 'imageMin', 'index', 'copy']);

gulp.task('clean', function () {
  return gulp.src(paths.dist, {
    read: false
  })
    .pipe(clean());
});

gulp.task('scripts', ['clean', 'templateCache'], function() {
  gulp.src(paths.scripts)
  //.pipe(jshint())
  //.pipe(jshint.reporter('default'))
    .pipe(ngAnnotate({
      remove: true,
      add: true,
      single_quotes: true
    }))
    .pipe(uglify())
    .pipe(concat(files.jsbundle))
    .pipe(gulp.dest(paths.dist + 'js'));
});

gulp.task('index', ['clean'], function () {
  gulp.src(paths.html)
    .pipe(htmlReplace({
      'css': 'css/app.min.css',
      'js': 'js/app.bundle.min.js'
    }))
    .pipe(gulp.dest(paths.dist + '.'));
});

gulp.task('templateCache', ['clean'], function() {
  return gulp.src(paths.templates)
    .pipe(templateCache({
      'filename': 'templates.js',
      'root': 'templates/',
      'module': 'app'
    }))
    .pipe(gulp.dest('./www/js'));
});

gulp.task('copy', ['clean'], function() {
  // Copy ionic bundle file
  gulp.src(paths.ionicBundle)
    .pipe(gulp.dest(paths.dist + 'lib/ionic/js/.'));

  // Copy lib scripts
  gulp.src(paths.lib)
    .pipe(gulp.dest(paths.dist + 'lib'));
});

gulp.task('minAppCss', function() {
  return gulp.src('./www/css/' + files.appcss)
    .pipe(minifyCss())
    .pipe(rename({
      extname: '.min.css'
    }))
    .pipe(gulp.dest('./www/css/'));
});

gulp.task('styles', ['clean', 'minAppCss'], function() {
  gulp.src(paths.css)
    .pipe(gulp.dest(paths.dist + 'css'));
});

gulp.task('imageMin', ['clean'], function() {
  gulp.src(paths.images)
    .pipe(imageMin())
    .pipe(gulp.dest(paths.dist + 'img'));
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
    .on('end', done);
});

gulp.task('watch', function () {
  gulp.watch(paths.sass, ['sass']);
  gulp.watch(paths.css, ['minAppCss']);
  gulp.watch(paths.scripts, ['scripts'])
});

gulp.task('install', ['git-check'], function () {
  return bower.commands.install()
    .on('log', function (data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

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
