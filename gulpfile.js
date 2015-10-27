var gulp = require('gulp');
var sass = require('gulp-sass');
var browserSync = require('browser-sync');
var useref = require('gulp-useref');
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');
var minifyCSS = require('gulp-minify-css');
var imagemin = require('gulp-imagemin');
var cache = require('gulp-cache');
var del = require('del');
var runSequence = require('run-sequence');
var swig = require('gulp-swig');
var autoprefixer = require('gulp-autoprefixer');
var inline_base64 = require('gulp-inline-base64');
var notifier = require('node-notifier');
var util = require('gulp-util');

function onError(err) {
  // Notification
  notifier.notify({
    'title': 'Error',
    'message': err.message
  });
  // Log to console
  util.log(util.colors.red('ERROR'), err.message);
  this.emit('end');
}


gulp.task('browserSync', function() {
  browserSync({
    server: {
      baseDir: 'app'
    },
  })
});


gulp.task('clean', function(callback) {
  del('dist');
  return cache.clearAll(callback);
})


gulp.task('clean:dist', function(callback){
  return del(['dist/**/*', '!dist/CNAME', '!dist/favicon.png'], callback)
});


gulp.task('fonts', function() {
  return gulp.src('app/public/fonts/**/*')
    .pipe(gulp.dest('dist/public/fonts'))
})


gulp.task('images', function(){
  return gulp.src('app/public/images/**/*.+(png|jpg|jpeg|gif|svg)')
	  // Caching images that ran through imagemin
	  .pipe(cache(imagemin({
      interlaced: true
    })))
	  .pipe(gulp.dest('dist/public/images'))
});


gulp.task('sass', function(cb){
  return gulp.src('app/scss/styles.scss')
    .pipe(sass({ errLogToConsole: true, imagePath: 'app/' }))
    .on('error', onError)
    .pipe(inline_base64({
        baseDir: 'app/public/',
        maxSize: 14 * 1024,
        debug: false
    }))
    .pipe(autoprefixer("last 2 version", "> 1%", {
        cascade: true
    }))
    .pipe(gulp.dest('app/public/css'))
    .pipe(browserSync.reload({
      stream: true
    }))
});


gulp.task('templates', function() {
  return gulp.src(['app/templates/**/*.html', '!app/templates/layout/*.html', '!app/templates/partials/*.html'])
    .pipe(swig({
      defaults: { cache: false }
    }))
    .on('error', onError)
    .pipe(gulp.dest('app/'))
    .on("end", browserSync.reload);
});


gulp.task('useref', function(){
  var assets = useref.assets();

  return gulp.src('app/*.html')
    .pipe(assets)
    .pipe(gulpIf('*.css', minifyCSS()))
    .pipe(gulpIf('*.js', uglify()))
    .pipe(assets.restore())
    .pipe(useref())
    .pipe(gulp.dest('dist'))
});


gulp.task('watch', ['browserSync', 'sass'], function () {
  gulp.watch('app/scss/**/*.scss', ['sass']);
  gulp.watch('app/templates/**/*.html', ['templates']);
  gulp.watch('app/*.html', browserSync.reload);
  gulp.watch('app/public/scripts/**/*.js', browserSync.reload);
});

gulp.task('build', function (callback) {
  runSequence('clean:dist',
    ['sass', 'useref', 'images', 'fonts'],
    callback
  )
});

gulp.task('default', function (callback) {
  runSequence(['templates', 'sass', 'browserSync', 'watch'],
    callback
  )
});