import gulp from "gulp";
import browserSync from "browser-sync";
import childProcess from "child_process";
import rename from "gulp-rename";
import size from "gulp-filesize";
import gulpSass from "gulp-sass";
import dartSass from "sass";
import autoprefixer from "gulp-autoprefixer";
import cleanCss from "gulp-clean-css";
import purgecss from "gulp-purgecss";
import log from "fancy-log";

const sass = gulpSass( dartSass );


const messages = {
  jekyllBuild: '<span style="color: grey">Running:</span> $ jekyll build',
  sassBuild: '<span style="color: grey">Running:</span> sass build',
};

gulp.task("sass-build", function () {
  browserSync.notify(messages.sassBuild);
  let gulpResult;
  gulpResult = gulp
    .src("css/*.scss")
    .pipe(sass())
    .pipe(autoprefixer())
    .pipe(cleanCss())
    .pipe(
      purgecss({
        content: ["_site/**/*.html"],
      })
    )
    .pipe(rename({ extname: ".min.css" }))
    .pipe(gulp.dest("_site/css/"))
    .pipe(size());
  if (process.env.NODE_ENV == "development") {
    gulpResult = gulpResult.pipe(browserSync.stream());
  }
  return gulpResult;
});

gulp.task("jekyll-build", function (done) {
  browserSync.notify(messages.jekyllBuild);
  let spawnCommand, spawnArgs, spawnEnv;
  if (process.env.NODE_ENV == "production") {
    spawnCommand = "bundle";
    spawnArgs = ["exec", "jekyll", "build"];
    spawnEnv = {
      env: { ...process.env, TZ: "Asia/Singapore", JEKYLL_ENV: "production" },
    };
  } else {
    spawnCommand = "bundle";
    spawnArgs = ["exec",
    "jekyll",
    "build",
    "--disable-disk-cache",
    "--config",
    "_config.yml,_config.dev.yml"];
  }
  return childProcess
    .spawn(spawnCommand, spawnArgs, {
      stdio: "inherit",
      spawnEnv,
    })
    .on("exit", function (code) {
      return done(
        code === 0 ? null : "ERROR: Jekyll process exited with code: " + code
      );
    });
});

gulp.task(
  "jekyll-rebuild",
  gulp.series("jekyll-build", async function () {
    browserSync.reload();
  })
);

gulp.task("watch", function () {
  gulp.watch(
    [
      "index.*",
      "_layouts/*.html",
      "_posts/*",
      "_includes/*.html",
      "_drafts/*",
      "_data/*.yml",
      "_config.yml",
      "_config.dev.yml",
      "about/**.*",
      "contact/**.*",
      "events/**.*",
      "files/**.*",
      "membership/**.*",
      "misc/**.*",
      "news/**.*",
      "redirects/**.*",
    ],
    gulp.series("jekyll-rebuild")
  );
});

gulp.task("watch-sass", function () {
  gulp.watch(["css/*.scss", "_sass/*.scss"], gulp.series("sass-build"));
});

gulp.task("set-development-environment", async function () {
  log("Running in development mode...");
  return (process.env.NODE_ENV = "development");
});

gulp.task("set-production-environment", async function () {
  log("Running in production mode...");
  return (process.env.NODE_ENV = "production");
});

gulp.task(
  "serve",
  gulp.series("sass-build", "jekyll-build", async function () {
    browserSync.init({
      server: { baseDir: "_site/" },
      port: 4000,
      browser: "Google Chrome",
    });
  })
);

gulp.task(
  "build",
  gulp.series("set-production-environment", "jekyll-build", "sass-build")
);

gulp.task(
  "default",
  gulp.series(
    "set-development-environment",
    "serve",
    gulp.parallel("watch", "watch-sass")
  )
);
