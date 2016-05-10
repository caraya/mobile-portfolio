/*jslint node: true */

'use strict';
// For when imports are supported
// Require Gulp first
//import gulp from 'gulp';
// Load plugins
//import $  from 'gulp-load-plugins';
// Static Web Server stuff
//import browserSync from 'browser-sync';
// This should be covered in the prior import
//import reload from 'browserSync';
//import historyApiFallback from 'connect-history-api-fallback';
// SASSDoc
//import sassdoc from 'sassdoc';
// Critical CSS
//import critical from 'critical';
// Imagemin and Plugins
//import imagemin from 'gulp-imagemin';
//import mozjpeg from 'imagemin-mozjpeg';
//import webp from 'imagemin-webp';
// Utilities
//import runSequence from 'run-sequence';
//import del from 'del';

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
 * @name log
 * @description Function to log messages to output stream
 *
 * Taken from {@link http://johnpapa.net/|John Papa}'s Pluralsight course on
 * Gulp
 */
function log(msg) {
    var item;
    if (typeof (msg) === 'object') {
        for (item in msg) {
            if (msg.hasOwnProperty(item)) {
                $.util.log($.util.colors.inverse(msg[item]));
            }
        }
    } else {
        $.util.log($.util.colors.inverse(msg));
    }
}

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
 * @name errorLogger
 * @description Custom error logger
 * @param error {} - Error message to display
 */
function errorLogger(error) {
    log('*** Error Start ***');
    log(error);
    log('*** Error End ***');
    this.emit('end');
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

/**
 * @name babelNext
 * @description Transpiles ESNext to ES6 using Babel preset for Stage 0 proposals to TC39
 *
 * The way this work can change at any time without warning use at your own risk. New proposals may be added and existing ones removed
 *
 * @see {@link http://www.2ality.com/2015/11/tc39-process.html|The TC39 process for ECMAScript features}
 * @see {@link https://github.com/tc39/ecma262/blob/master/stage0.md|TC39 proposals at stage 0}
 */
gulp.task('babelNext', () => {
    return gulp.src('app/es6/**/*.js')
        .pipe($.sourcemaps.init())
        .pipe($.babel({
            presets: ['stage-0']
        }))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('app/js/experimental'))
        .pipe($.size({
            pretty: true,
            title: 'Babel Experimental'
        }));
});

/**
 * @name coffee
 * @description Transpiles Coffeescript to ES5
 *
 * @see {@link http://coffeescript.org/|Coffeescript}
 */
gulp.task('coffee', () => {
    return gulp.src('app/coffee/**/*.coffee')
        .pipe($.sourcemaps.init())
        .pipe($.coffee())
        .pipe($.sourcemaps.write())
        .pipe(gulp.dest('app/js/'))
        .pipe($.size({
            pretty: true,
            title: 'Coffee'
        }));
});

/**
 * @name typescript
 * @description EXPERIMENTAL TYPESCRIPT SUPPORT
 *
 * Not sure I want to keep it so be warned
 *
 * uses gulp-typescript, gulp-tslint and tslint (peer dep of gulp-tslint)
 * @see  {@link http://www.typescriptlang.org/|Typescript}
 */
gulp.task('typescript', () => {
    return gulp.src('app/ts/**/*.ts')
        .pipe($.ts({
            noImplicitAny: true,
            out: 'scripts-ts.js',
            target: 'es5'
        }))
        .pipe($.tslint())
        .pipe($.tslint.report('verbose', { emitError: false }))
        .pipe(gulp.dest('app/js'));
});

// Javascript style and syntax validation
// RUN THE TASK BELOW AFTER TRANSPILING ES6, TYPESCRIPT AND COFFEE FILES

/**
 * @name js-lint
 * @description Run JSHint in all js files, including the gulpfile and all files under js
 * @see {@link http://jshint.com/docs/|JSHint Documentation}
 */
gulp.task('js-lint', () => {
    return gulp.src(['gulpfile.js', 'app/js/**/*.js'])
        .pipe($.jshint())
        .pipe($.jshint.reporter('jshint-stylish'));
});

/**
 * @name js-style
 * @description Run jscs on all file under app/js
 *
 * Since they have merged with eslint it may be a good idea to migrate too. Will wait to see how this plays out
 *
 * @see {@link http://jscs.info/|jscs}
 */
gulp.task('js-style', () => {
    return gulp.src(['app/js/**/*.js'])
        .pipe($.jsstyle())
        .pipe($.jscs.reporter())
        .pipe($.size({
            pretty: true,
            title: 'jscs'
        }));
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

// SCSS conversion and CSS processing
/**
 * @name sass:dev
 * @description SASS conversion task to produce development css with expanded syntax.
 *
 * We run this task agains Ruby SASS, not lib SASS. As such it requires the SASS Gem to be installed
 *
 * @see {@link http://sass-lang.com|SASS}
 * @see {@link http://sass-compatibility.github.io/|SASS Feature Compatibility}
 */
gulp.task('sass:dev', () => {
    return $.sass('app/scss/**/*.scss', { sourcemap: true, style: 'expanded'})
        .pipe(gulp.dest('app/css/expanded'))
        .pipe($.size({
            pretty: true,
            title: 'SASS'
        }));
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
gulp.task('sass:production', () => {
    return $.sass('app/scss/**/*.scss', { sourcemap: true, style: 'compressed'})
        .pipe(gulp.dest('app/css/expanded'))
        .pipe($.size({
            pretty: true,
            title: 'SASS'
        }));
});

/**
 * @name scss-lint
 * @description Runs scss-lint against your SCSS files (will not work on files written with the original SASS syntax) to provide style checks.
 *
 * This task depends on the scss-lint Ruby gem
 *
 * @see {@link https://github.com/brigade/scss-lint|scss-lint}
 */
gulp.task('scss-lint', () => {
    return gulp.src(['app/scss/**/*.scss'])
        .pipe($.scsslint({
            'reporterOutputFormat': 'Checkstyle'
        }));
});

/**
 * @name sassdoc
 * @description generate documentation from your SASS stylesheets
 *
 * @see {@link http://sassdoc.com/|SASSDoc}
 * @see {@link http://sassdoc.com/getting-started/|SASSDoc documentation}
 */
gulp.task('sassdoc', () => {
    return gulp.src('app/sass/**/*.scss')
        .pipe(sassdoc({
            dest: 'app/sassdocs',
            verbose: true,
            display: {
                access: ['public', 'private'],
                alias: true
            }
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
        .pipe($.cleanCSS({
            advanced: false,
            aggressiveMerging: false,
            debug: true,
            keepBreaks: true,
            mediaMerging: false,
            processImport: false,
            rebase: false,
        }, (details) => {
            log(details.name + ': ' + details.stats.originalSize);
            log(details.name + ': ' + details.stats.minifiedSize);
        }))
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

/**
 * @name useref
 * @description Use build blocks to do three things:

 1. update the references in your html from orginals to an optionally versioned, optimized file
 2. perform file concatenation
 3. Perform file minification.

 Utilize build blocks in your html to indicate the files to be concatenated and minified. This task will parse the build blocks by updating the <script> and <style> blocks in your html, and it will schedule the concatenation and minification of the desired files by dynamically updating the concat, uglify, and cssmin (part of grunt-css - this is auto included as a dependency for grunt-useref) tasks.

 This task modifies files, so it should be executed on a temp directory or the final build directory.

 This task relies on the concat, uglify, and cssmin tasks to be run after it... concat first.
 * @see {@link https://www.npmjs.com/package/gulp-useref|gulp-useref}
 */
gulp.task('useref', () => {
    return gulp.src('app/*.html')
        .pipe($.useref({ searchPath: '.tmp' }))
        .pipe(gulp.dest('dist/*.html'));
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
 * Use the `nokey` option to try out PageSpeed Insights as part of your build process. For more frequent use, we recommend registering for your own API key.
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
    return gulp.src('app/images/*')
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [
                {removeViewBox: false},
                {cleanupIDs: false}
            ],
            use: [mozjpeg()]
        }))
        .pipe(webp({quality: 50})())
        .pipe(gulp.dest('app/images'))
        .pipe($.size({
            pretty: true,
            title: 'imagemin'
        }));
});

/**
 * @name processImages
 * @description processImages creates a set of reponsive images for each of the PNG and JPG images in the images directory
 *
 * @see {@link http://sharp.dimens.io/en/stable/install/|Sharp}
 * @see {@link https://github.com/jcupitt/libvips|LibVIPS dependency for Mac}
 * @see {@link https://www.npmjs.com/package/gulp-responsive|gulp-responsive}
 * @see {@link imagemin}
 *
 */
gulp.task('processImages', () => {
    return gulp.src(['app/images/**/*.{jpg,png}', '!app/images/touch/*.png'])
        .pipe($.responsive({
                '*': [{
                    // image-small.jpg is 200 pixels wide
                    width: 200,
                    rename: {
                        suffix: '-small',
                        extname: '.jpg'
                    }
                }, {
                    // image-small@2x.jpg is 400 pixels wide
                    width: 200 * 2,
                    rename: {
                        suffix: '-small@2x',
                        extname: '.jpg'
                    }
                }, {
                    // image-large.jpg is 480 pixels wide
                    width: 480,
                    rename: {
                        suffix: '-large',
                        extname: '.jpg'
                    }
                }, {
                    // image-large@2x.jpg is 960 pixels wide
                    width: 480 * 2,
                    rename: {
                        suffix: '-large@2x',
                        extname: '.jpg'
                    }
                }, {
                    // image-extralarge.jpg is 1280 pixels wide
                    width: 1280,
                    rename: {
                        suffix: '-extralarge',
                        extname: '.jpg'
                    }
                }, {
                    // image-extralarge@2x.jpg is 2560 pixels wide
                    width: 1280 * 2,
                    rename: {
                        suffix: '-extralarge@2x',
                        extname: '.jpg'
                    }
                }, {
                    // image-small.webp is 200 pixels wide
                    width: 200,
                    rename: {
                        suffix: '-small',
                        extname: '.webp'
                    }
                }, {
                    // image-small@2x.webp is 400 pixels wide
                    width: 200 * 2,
                    rename: {
                        suffix: '-small@2x',
                        extname: '.webp'
                    }
                }, {
                    // image-large.webp is 480 pixels wide
                    width: 480,
                    rename: {
                        suffix: '-large',
                        extname: '.webp'
                    }
                }, {
                    // image-large@2x.webp is 960 pixels wide
                    width: 480 * 2,
                    rename: {
                        suffix: '-large@2x',
                        extname: '.webp'
                    }
                }, {
                    // image-extralarge.webp is 1280 pixels wide
                    width: 1280,
                    rename: {
                        suffix: '-extralarge',
                        extname: '.webp'
                    }
                }, {
                    // image-extralarge@2x.webp is 2560 pixels wide
                    width: 1280 * 2,
                    rename: {
                        suffix: '-extralarge@2x',
                        extname: '.webp'
                    }
                }, {
                    // Global configuration for all images
                    // The output quality for JPEG, WebP and TIFF output formats
                    quality: 80,
                    // Use progressive (interlace) scan for JPEG and PNG output
                    progressive: true,
                    // Skip enalrgement warnings
                    skipOnEnlargement: false,
                    // Strip all metadata
                    withMetadata: true
                }]
            })
            .pipe(gulp.dest('dist/images')));
});

/**
 * @name polymerBuild
 *
 * @description Vulcanize and Crisper are Polymer specific tasks
 *
 * Vulcanize will combine all elements in elements.html and produce a single file. This is the same as a concatenate task except that it understands polymer idiosyncracies
 *
 * We run crisper in the vulcanized output to extract scripts so we comply with CSP.
 *
 * @see {@link https://www.polymer-project.org/1.0/tools/overview.html#vulcanize|Vulcanize}
 * @see {@link https://www.polymer-project.org/1.0/tools/overview.html#crisper|Crisper}
 */
gulp.task('polymerBuild', () => {
    return gulp.src('app/elements/elements.html')
        .pipe($.vulcanize({
            stripComments: false,
            inlineCss: true,
            inlineScripts: true
        }))
        .pipe($.crisper({
            scriptInHead: false, // true is default
            onlySplit: false
        }))
        .pipe(gulp.dest('dist/elements'))
        .pipe($.size({title: 'vulcanize'}));
});

/**
 * @name CopyAssets
 * @description Copies assets into the distribution directory. It excludes material that will be addressed by more specific tasks later
 */
gulp.task('copyAssets', () => {
    return gulp.src([
        'app/**/*',
        '!app/coffee',
        '!app/es6',
        '!app/scss',
        '!app/test',
        '!app/bower_components',
        '!app/fonts',
        '!app/cache-config.json',
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
 * @name copyBower
 * @description Copies the content from bower_components to the distribution folder. Does not include Polymer specific content. That is handled by `copyBowerPolymer`
 * @see {@link copyBowerPolymer}
 */
gulp.task('copyBower', () => {
    return gulp.src([
        'bower_components/**/*',
        '!bower_components/{webcomponentsjs,platinum-sw,sw-toolbox,promise-polyfill}/**/*'
    ], {
        dot: false
    }).pipe(gulp.dest('dist/elements'))
        .pipe($.size({
            pretty: true,
            title: 'copy'
        }));
});

/**
 * @name copyBowerPolymer
 * @description Copies Polymer related content that is not handled by Vulcanize from Bower to the distribution element.
 * @see {@link copyBower}
 */
gulp.task('copyBowerPolymer', () => {
    // Copy over only the bower_components we need
    // These are things which cannot be vulcanized
    return gulp.src([
        'bower_components/{webcomponentsjs,platinum-sw,sw-toolbox,promise-polyfill}/**/*'
    ], {
        dot: false
    }).pipe(gulp.dest('dist/elements'))
        .pipe($.size({
            pretty: true,
            title: 'copy bower elements'
        }));
});

/**
 * @name copyFonts
 * @description Copies fonts to distribution directory. We use a custom task to make sure we comply with any license requirements.
 */
gulp.task('copyFonts', () => {
    return gulp.src(['app/fonts/**'])
        .pipe(gulp.dest('dist/fonts/'))
        .pipe($.size({
            title: 'fonts'
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

// // Watch files for changes & reload
// // This version serves content from the app source directory
// gulp.task('serve', () => {
//   browserSync({
//     port: 2509,
//     notify: false,
//     logPrefix: 'ATHENA',
//     snippetOptions: {
//       rule: {
//         match: '<span id="browser-sync-binding"></span>',
//         fn: function (snippet) {
//           return snippet;
//         }
//       }
//     },
//     // Run as an https by uncommenting 'https: true'
//     // Note: this uses an unsigned certificate which on first access
//     //       will present a certificate warning in the browser.
//     // https: true,
//     server: {
//       baseDir: ['.tmp', 'app'],
//       middleware: [historyApiFallback()]
//     }
//   });
//
//   gulp.watch(['app/**/*.html'], reload);
//   gulp.watch(['app/css/**/*.scss'], ['sass', 'processCSS', reload]);
//   gulp.watch(['app/images/**/*'], reload);
// });
//
// // Build and serve the output from the dist build
// gulp.task('serve:dist', () => {
//   browserSync({
//     port: 5001,
//     notify: false,
//     logPrefix: 'ATHENA',
//     snippetOptions: {
//       rule: {
//         match: '<span id="browser-sync-binding"></span>',
//         fn: function (snippet) {
//           return snippet;
//         }
//       }
//     },
//     // Run as an https by uncommenting 'https: true'
//     // Note: this uses an unsigned certificate which on first access
//     //       will present a certificate warning in the browser.
//     // https: true,
//     server: 'dist/',
//     middleware: [historyApiFallback()]
//   });
// });

// COMBINED TASKS
gulp.task('prep', () => {
    runSequence('clean', ['copyAssets', 'copyBower', 'copyFonts'], 'processImages');
});
