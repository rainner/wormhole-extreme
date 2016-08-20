/**
 * Dependencies
 */
var PKG        = require( "./package.json" ),
    gulp       = require( "gulp" ),
    plumber    = require( "gulp-plumber" ),
    sass       = require( "gulp-sass" ),
    prefix     = require( "gulp-autoprefixer" ),
    cleancss   = require( "gulp-clean-css" ),
    uglify     = require( "gulp-uglify" ),
    replace    = require( "gulp-replace" ),
    concat     = require( "gulp-concat" ),
    header     = require( "gulp-header" ),
    wrapper    = require( "gulp-wrapper" ),
    watch      = require( "gulp-watch" ),
    sync       = require( "browser-sync" ).create();

/**
 * Builder class
 */
var Builder = function()
{
    this._server   = "";
    this._port     = 8888;
    this._output   = "";
    this._outname  = "bundle.min";
    this._timers   = { css: 0, js: 0, html: 0, img: 0 };
    this._files    = { css: [], js: [], html: [], img: [] };
    this._wlist    = [];
    this._serving  = false;
    this._watching = false;

    this.initWatch     = this.initWatch.bind( this );
    this._buildOnWatch = this._buildOnWatch.bind( this );
    this._buildAll     = this._buildAll.bind( this );
    this._buildCss     = this._buildCss.bind( this );
    this._buildJs      = this._buildJs.bind( this );
    this._buildHtml    = this._buildHtml.bind( this );
    this._buildImg     = this._buildImg.bind( this );
};

Builder.prototype = {
    constructor : Builder,

    // set server (browser-sync) base path and port
    setupServer : function( base, port )
    {
        this._server = ( base && typeof base === "string" ) ? base : "";
        this._port   = ( port && typeof port === "number" ) ? port : 8888;
    },

    // set output path
    setOutputPath : function( path )
    {
        this._output = ( path && typeof path === "string" ) ? path : "";
    },

    // start timer count
    logStart : function( type )
    {
        if( type && this._timers.hasOwnProperty( type ) )
        {
            this._timers[ type ] = Date.now();
        }
    },

    // log timer count and message to console
    logDone : function( type )
    {
        if( type && this._timers.hasOwnProperty( type ) )
        {
            var start = this._timers[ type ],
                secs  = ( Date.now() - start ) / 1000,
                info  = "Finished";

            switch( type ) {
                case "css"  : info += " building CSS bundle";  break;
                case "js"   : info += " building JS bundle";   break;
                case "html" : info += " building HTML bundle"; break;
                case "img"  : info += " processing images";    break;
            }
            console.log( info + ", in "+ secs +" seconds." );
        }
    },

    // build bundle header comment
    getHeader : function()
    {
        return [
            "/*!",
            " * @Compiled: " + new Date() + ".",
            " * @Description: " + String( PKG.description || "No description" ),
            " * @Author: " + String( PKG.author.name || PKG.author || "No author" ),
            " */"
        ].join( "\n" ) + "\r\n";
    },

    // get all files
    getFiles : function()
    {
        return [].concat(
            this._files.css,
            this._files.js,
            this._files.html,
            this._files.img
        );
    },

    // flush added styles and scripts
    flushFiles : function()
    {
        this._files = { css: [], js: [], html: [], img: [] };
    },

    // send error to console
    onError : function( error )
    {
        console.log( error || "Empty error message." );
        this.emit && this.emit( "end" );
    },

    // add style to the list
    bundleCss : function( value )
    {
        if( value && typeof value === "string" && this._files.css.indexOf( value ) < 0 )
        {
            this._files.css.push( value );
        }
    },

    // add script to the list
    bundleJs : function( value )
    {
        if( value && typeof value === "string" && this._files.js.indexOf( value ) < 0 )
        {
            this._files.js.push( value );
        }
    },

    // add html to the list
    bundleHtml : function( value )
    {
        if( value && typeof value === "string" && this._files.html.indexOf( value ) < 0 )
        {
            this._files.html.push( value );
        }
    },

    // add image to the list
    bundleImg : function( value )
    {
        if( value && typeof value === "string" && this._files.img.indexOf( value ) < 0 )
        {
            this._files.img.push( value );
        }
    },

    // add path to watch list
    watchFiles : function( value )
    {
        if( value && typeof value === "string" && this._wlist.indexOf( value ) < 0 )
        {
            this._wlist.push( value );
        }
    },

    // watch input files for changes
    initWatch : function()
    {
        // start browser-sync instance
        if( this._server && this._serving !== true )
        {
            this._serving = true;
            sync.init({
                ui : false,
                open : false,
                server : this._server,
                port : this._port,
                logLevel : "debug",
                logPrefix : "GulpBuilder",
                scrollRestoreTechnique : "cookie",
            });
        }

        // watch for changes
        if( this._wlist.length && this._watching !== true )
        {
            this._watching = true;
            gulp.watch( this._wlist, this._buildOnWatch ).on( "change", function( e )
            {
                var file = e.path.replace( __dirname, "" ).replace( /[\\]+/g, "/" );
                console.log( "\n" + "File "+ e.type  +": " + file + ", ..." );
            });
        }
    },

    // build bundle based on type of last file changed
    _buildOnWatch : function( item )
    {
        if( item.path )
        {
            if( /\.(s?css)$/i.test( item.path ) )
            {
                this._buildCss();
            }
            if( /\.(jsx?)$/i.test( item.path ) )
            {
                this._buildJs();
            }
            if( /\.(html?|jade)$/i.test( item.path ) )
            {
                this._buildHtml();
            }
            if( /\.(jpe?g|png|gif|bmp)$/i.test( item.path ) )
            {
                this._buildImg();
            }
            return; // done here
        }
        this._buildAll(); // fallback
    },

    // build all bundles
    _buildAll : function()
    {
        this._buildCss();
        this._buildJs();
        this._buildHtml();
        this._buildImg();
    },

    // build css bundle
    _buildCss : function()
    {
        if( this._files.css.length && this._output )
        {
            this.logStart( "css" );
            var logDone = this.logDone.bind( this );

            gulp
            .src( this._files.css )
            .on( "end", function(){ logDone( "css" ); } )
            .pipe( plumber( { errorHandler: this.onError } ) )
            .pipe( sass().on( "error", this.onError ) )
            .pipe( prefix( { browsers: ["last 2 versions", "> 1%", "opera 12.1", "bb 10", "android 4"] } ) )
            .pipe( cleancss( { advanced: false, keepBreaks: false, keepSpecialComments: false } ) )
            .pipe( replace( /[\t\r\n]+/g, "" ) )
            .pipe( wrapper( { header: "/* Source: ${filename} */ \r\n" } ) )
            .pipe( concat( this._outname +".css", { newLine: "\r\n\r\n" } ) )
            .pipe( header( this.getHeader() ) )
            .pipe( gulp.dest( this._output +"/css" ) )
            .pipe( sync.stream() );
        }
    },

    // build js bundle
    _buildJs : function()
    {
        if( this._files.js.length && this._output )
        {
            this.logStart( "js" );
            var logDone = this.logDone.bind( this );

            gulp
            .src( this._files.js )
            .on( "end", function(){ logDone( "js" ); } )
            .pipe( plumber( { errorHandler: this.onError } ) )
            .pipe( uglify( { preserveComments: false } ).on( "error", this.onError ) )
            .pipe( replace( /[\t\r\n]+/g, "" ) )
            .pipe( wrapper( { header: "/* Source: ${filename} */ \r\n" } ) )
            .pipe( concat( this._outname +".js", { newLine: "\r\n\r\n" } ) )
            .pipe( header( this.getHeader() ) )
            .pipe( gulp.dest( this._output +"/js" ) )
            .pipe( sync.stream() );
        }
    },

    // build html bundle
    _buildHtml : function()
    {
        if( this._files.html.length && this._output )
        {
            this.logStart( "html" );
            var logDone = this.logDone.bind( this );

            gulp
            .src( this._files.html )
            .on( "end", function(){ logDone( "html" ); } )
            .pipe( plumber( { errorHandler: this.onError } ) )
            .pipe( concat( this._outname +".html", { newLine: "\r\n\r\n" } ) )
            .pipe( gulp.dest( this._output +"/html" ) )
            .pipe( sync.stream() );
        }
    },

    // build image files
    _buildImg : function()
    {
        if( this._files.img.length && this._output )
        {
            this.logStart( "img" );
            var logDone = this.logDone.bind( this );

            gulp
            .src( this._files.img )
            .on( "end", function(){ logDone( "img" ); } )
            .pipe( gulp.dest( this._output +"/img" ) )
            .pipe( sync.stream() );
        }
    },

};

/**
 * Export
 */
module.exports = Builder;