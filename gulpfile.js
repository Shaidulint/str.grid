var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    jshint = require('gulp-jshint'),
    concat = require('gulp-concat'),
    uglifycss = require('gulp-uglifycss');
    //concatcss = require('gulp-concat-css');

gulp.task('minify', function() {
    gulp.src(['src/str.simple.grid.js', 'src/str.simple.svg.js', 'src/str.simple.chart.js'])
        //.pipe(jshint())
        //.pipe(jshint.reporter('default'))
        .pipe(uglify())
        .pipe(concat('str.grid.min.js'))
        .pipe(gulp.dest('build'));

    gulp.src('src/*.css')
        .pipe(uglifycss())
        .pipe(concat('str.grid.min.css'))
        .pipe(gulp.dest('build'));
});