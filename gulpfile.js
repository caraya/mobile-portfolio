/*jslint node: true */

'use strict';
// These require statements are for plugins that cannot be loaded using gulp-load-plugins
// because they don't start with gulp-
// Require Gulp first
var gulp = require('gulp'),
//  packageJson = require('./package.json'),
// Load plugins
    $ = require('gulp-load-plugins')({lazy: true}),
// Static Web Server stuff
    browserSync = require('browser-sync'),
    reload = browserSync.reload,
    historyApiFallback = require('connect-history-api-fallback'),
// Autoprefixer
    autoprefixer = require('autoprefixer'),
// SASSDoc
    sassdoc = require('sassdoc'),
// Critical CSS
    critical = require('critical'),
// Imagemin and Plugins
    imagemin = require('gulp-imagemin'),
    mozjpeg = require('imagemin-mozjpeg'),
    webp = require('imagemin-webp'),
// Utilities
    runSequence = require('run-sequence'),
    del = require('del');

//var key = '';
var site = 'https://caraya.github.io/athena-template/';

// List of browser versions we'll autoprefix for.
// Taken from the Polymer Starter Kit gulpfile
var AUTOPREFIXER_BROWSERS = [
    'ie >= 10',
    'ie_mob >= 10',
    'ff >= 30',
    'chrome >= 34',
    'safari >= 7',
    'opera >= 23',
    'ios >= 7',
    'android >= 4.4',
    'bb >= 10'
];

// UTILITY FUNCTIONS

/**
 * @name clean
 * @description Function to delete a given path. We specify the path in the task we create
 * @param {string} path - Path to delete
 * @param  done - indicates we've completed the task
 */
function clean(path, done) {
    log('Cleaning ' + $.util.colors.red(path));
    del(path, done);
}

/**
 * @name babel
 * @description Transpiles ES6 to ES5 using Babel. As Node and browsers support more of the spec natively this will move to supporting ES2016 and later transpilation
 *
 * It requires the `babel` and `babel-preset-es2015` plugins
 *
 * @see {@link http://babeljs.io/|Babel}
 * @see {@link http://babeljs.io/docs/learn-es2015/|Learn ES2015}
 * @see {@link http://www.ecma-international.org/ecma-262/6.0/|ECMAScript 2015 specification}
 */
gulp.task('babel', () => {
    return gulp.src('app/es6/**/*.js')
        .pipe($.sourcemaps.init())
        .pipe($.babel({
            presets: ['es2015']
        }))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('app/js/'))
        .pipe($.size({
            pretty: true,
            title: 'Babel'
        }));
});


// Javascript style and syntax validation
/**
 * @name eslint
 * @description runs eslint with the Google configuration
 *
 */
gulp.task('lint', () => {
  return gulp.src(['**/*.js','!node_modules/**'])
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.eslint.failAfterError());
});

/**
 * @name jsdoc
 * @description runs jsdoc on the gulpfile and README.md to genereate documentation
 *
 * @see {@link https://github.com/jsdoc3/jsdoc|JSDOC}
 */
gulp.task('jsdoc', () => {
    return gulp.src(['README.md', 'gulpfile.js'])
        .pipe($.jsdoc3())
});

/**
 * @name sass:production
 * @description SASS conversion task to produce production css with compressed syntax
 *
 * We run this task agains Ruby SASS, not lib SASS. As such it requires the SASS Gem to be installed
 *
 * @see {@link http://sass-lang.com|SASS}
 * @see {@link http://sass-compatibility.github.io/|SASS Feature Compatibility}
 */
gulp.task('sass', () => {
    return $.sass('app/scss/**/*.scss', { sourcemap: true, style: 'compressed'})
        .pipe(gulp.dest('app/css/expanded'))
        .pipe($.size({
            pretty: true,
            title: 'SASS'
        }));
});
/**
 * @name processCSS
 *
 * @description Run autoprefixer and cleanCSS on the CSS files under app/css
 *
 * Moved from gulp-autoprefixer to postcss. It may open other options in the future
 *
 * @see {@link https://www.npmjs.com/package/gulp-clean-css|gulp-clean-css}
 * @see {@link https://github.com/postcss/autoprefixer|autoprefixer}
 */
gulp.task('processCSS', () => {
    return gulp.src('app/css/**/*.css')
        .pipe($.changed('app/css/**/*.css', {extension: '.css'}))
        .pipe($.sourcemaps.init())
        .pipe($.postcss([
            autoprefixer({
                browsers: AUTOPREFIXER_BROWSERS
            })
        ]))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('dist/css'))
        .pipe($.size({
            pretty: true,
            title: 'processCSS'
        }));
});

/**
 * @name uncss
 * @description Taking a css and an html file, UNCC will strip all CSS selectors not used in the page
 *
 * @see {@link https://github.com/giakki/uncss|uncss}
 */
gulp.task('uncss', () => {
    return gulp.src('app/css/**/*.css')
        .pipe($.concat('main.css'))
        .pipe($.uncss({
            html: ['index.html']
        }))
        .pipe(gulp.dest('dist/css/all-clean.css'))
        .pipe($.size({
            pretty: true,
            title: 'Uncss'
        }));
});

// Generate & Inline Critical-path CSS
gulp.task('critical', () => {
    return gulp.src('app/*.html')
        .pipe(critical({
            base: 'app/',
            inline: true,
            css: ['app/css/main.css'],
            minify: true,
            extract: false,
            ignore: ['font-face'],
            dimensions: [{
                width: 320,
                height: 480
            }, {
                width: 768,
                height: 1024
            }, {
                width: 1280,
                height: 960
            }]
        }))
        .pipe($.size({
            pretty: true,
            title: 'Critical'
        }))
        .pipe(gulp.dest('dist'));
});


/**
 * @name psi:mobile
 * @description Mobile performance check using Google Page Speed Insight
 *
 * Use the `nokey` option to try out PageSpeed Insights as part of your build process. For more frequent use, we recommend registering for your own API key.
 *
 * @see {@link https://developers.google.com/speed/docs/insights/v2/getting-started|PSI Getting Started}
 */
gulp.task('psi:mobile', () => {
    return $.psi(site, {
        // key: key
        nokey: 'true',
        strategy: 'mobile'
    }).then(function (data) {
        console.log('Speed score: ' + data.ruleGroups.SPEED.score);
        console.log('Usability score: ' + data.ruleGroups.USABILITY.score);
    });
});

/**
 * @name psi:desktop
 * @description Desktop performance check using Google Page Speed Insight
 *
 * Use the `nokey` option to try out PageSpeed Insights as part of your build process. For more frequent use,
 * register for your own API key.
 *
 * @see {@link https://developers.google.com/speed/docs/insights/v2/getting-started|PSI Getting Started}
 */
gulp.task('psi:desktop', () => {
    return $.psi(site, {
        nokey: 'true',
        // key: key,
        strategy: 'desktop'
    }).then(function (data) {
        console.log('Speed score: ' + data.ruleGroups.SPEED.score);
    });
});

/**
 * @name imagemin
 * @description Reduces image file sizes. Doubly important if we'll choose to play with responsive images.
 *
 * Imagemin will compress jpg (using mozilla's mozjpeg), SVG (using SVGO) GIF and PNG images but WILL NOT create multiple versions for use with responsive images
 *
 * @see {@link https://github.com/postcss/autoprefixer|Autoprefixer}
 * @see {@link processImages}
 */
gulp.task('imagemin', () => {
    return gulp.src('app/img/**/*.{png,jpg,svg}')
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [
                {removeViewBox: false},
                {cleanupIDs: false}
            ],
            use: [mozjpeg()]
        }))
        .pipe(webp({quality: 50})())
        .pipe(gulp.dest('dist/img  '))
        .pipe($.size({
            pretty: true,
            title: 'imagemin'
        }));
});



/**
 * @name imagemin:views
 * @description Reduces image file sizes. Doubly important if we'll choose to play with responsive images.
 *
 * Imagemin will compress jpg (using mozilla's mozjpeg), SVG (using SVGO) GIF and PNG images but WILL NOT create multiple versions for use with responsive images
 *
 * @see {@link https://github.com/postcss/autoprefixer|Autoprefixer}
 * @see {@link processImages}
 */
gulp.task('imagemin:views', () => {
  return gulp.src('app/views/images/*.{png,jpg}')
    .pipe(imagemin({
      progressive: true,
      use: [mozjpeg()]
    }))
    .pipe(webp({quality: 50})())
    .pipe(gulp.dest('dist/views/images/'))
    .pipe($.size({
      pretty: true,
      title: 'imagemin'
    }));
});

/**
 * @name build
 * @description Copies assets into the distribution directory. It excludes material that will be addressed by more specific tasks later
 */
gulp.task('build', () => {
    return gulp.src([
        'app/**/*',
        '!app/img/',
        '!app/views/images',
        '!app/scss',
        '!app/test',
        '!**/.DS_Store' // Mac specific directory we don't want to copy over
    ], {
        dot: true
    }).pipe(gulp.dest('dist'))
        .pipe($.size({
            pretty: true,
            title: 'copy'
        }));
});

/**
 * @name clean
 * @description deletes specified files
 */
gulp.task('clean', () => {
    return del.sync([
        'dist/',
        '.tmp'
    ]);
});

/**
 * @name deploy
 *
 * @description Deploys the content from dist/ into the repository's gh-pages branch
 *
 * We do this so we can take advantage of HTTPS in gh-pages. If you're deploying to different servers you're on your own :-)
 */
gulp.task('deploy', () => {
    return gulp.src('./dist/**/*')
        .pipe($.ghPages())
        .pipe($.size({
            title: 'deploy'
        }));
});

// Watch files for changes & reload
// This version serves content from the app source directory
gulp.task('serve', () => {
  browserSync({
    port: 2509,
    notify: false,
    logPrefix: 'ATHENA',
    snippetOptions: {
      rule: {
        match: '<span id="browser-sync-binding"></span>',
        fn: function (snippet) {
          return snippet;
        }
      }
    },
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: {
      baseDir: ['.tmp', 'app'],
      middleware: [historyApiFallback()]
    }
  });

  gulp.watch(['app/**/*.html'], reload);
  gulp.watch(['app/css/**/*.scss'], ['sass', 'processCSS', reload]);
  gulp.watch(['app/images/**/*'], reload);
});

// Build and serve the output from the dist build
gulp.task('serve:dist', () => {
  browserSync({
    port: 5001,
    notify: false,
    logPrefix: 'ATHENA',
    snippetOptions: {
      rule: {
        match: '<span id="browser-sync-binding"></span>',
        fn: function (snippet) {
          return snippet;
        }
      }
    },
    // Run as an https by uncommenting 'https: true'
    // Note: this uses an unsigned certificate which on first access
    //       will present a certificate warning in the browser.
    // https: true,
    server: 'dist/',
    middleware: [historyApiFallback()]
  });
});
