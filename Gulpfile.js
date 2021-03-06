var gulp = require("gulp");
var sourcemaps = require("gulp-sourcemaps");
var ts = require("gulp-typescript");
var babel = require("gulp-babel");
var del = require("del");
var notify = require("gulp-notify");

var tsProject = ts.createProject("./tsconfig.json");

function build() {
  return gulp
    .src(["src/**/*.ts"])
    .pipe(sourcemaps.init())
    .pipe(tsProject())
    .pipe(babel())
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("dist"))
    .pipe(notify("Build Finished"));
}
gulp.task("build", build);

gulp.task("watch", function() {
  gulp.watch("src/**/*.ts", { ignoreInitial: false }, gulp.series(build));
});

gulp.task("clean", function() {
  return del(["dist/**/*", "dist/*"]);
});
