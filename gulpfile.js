/**
 * Dependencies
 */
var gulp    = require( "gulp" ),
    Builder = require( "./gulpbuilder.js" );

/**
 * ------------------------------------------------------------
 * Scene builder
 */
var scene = new Builder();
// browser-sync and output path
scene.setupServer( "./" );
scene.setOutputPath( "./dist" );
// watch for changes
scene.watchFiles( "./src/scss/*.scss" );
scene.watchFiles( "./src/js/*.js" );
// css build bundle
scene.bundleCss( "./src/scss/styles.scss" );
scene.bundleCss( "./src/scss/fontello.scss" );
// js build bundle
scene.bundleJs( "./src/js/Device.js" );
scene.bundleJs( "./src/js/Stage.js" );
scene.bundleJs( "./src/js/Nebula.js" );
scene.bundleJs( "./src/js/Stars.js" );
scene.bundleJs( "./src/js/Planets.js" );
scene.bundleJs( "./src/js/Wormhole.js" );
// build/watch/serve task
gulp.task( "initScene", scene.initWatch );

