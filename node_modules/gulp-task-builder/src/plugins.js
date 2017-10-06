'use strict';

var plugins = {
    webpack: require('webpack-stream'),
    concatCss: require('gulp-concat-css'),
    minifyCss: require('gulp-cssnano'),
    fileInclude: require('gulp-file-include'),
    removeEmptyLines: require('gulp-remove-empty-lines'),
    stylus: require('gulp-stylus'),
    concat: require('gulp-concat'),
    htmlMin: require("gulp-htmlmin"),
    rename: require("gulp-rename"),
    webServer: require('gulp-webserver')
};

module.exports = plugins;

plugins.extend = function (builder) {

    builder.webpack = function (c, uglify) {
        return builder.subTask(plugins.webpack(webpackConfig(c, uglify, builder)));
    };

    builder.stylus = function () {
        return builder.subTask(plugins.stylus());
    };

    builder.concatCss = function (filename) {
        return builder.subTask(plugins.concatCss(filename));
    };

    builder.fileInclude = function () {
        return builder.subTask(plugins.fileInclude());
    };

    builder.concat = function (filename) {
        return builder.subTask(plugins.concat(filename));
    };

    builder.removeEmptyLines = function () {
        return builder.subTask(plugins.removeEmptyLines());
    };

    builder.minifyCss = function () {
        return builder.subTask(plugins.minifyCss());
    };

    builder.minifyHtml = function () {
        return builder.subTask(plugins.htmlMin());
    };

    builder.serve = function (cfg) {
        return builder.subTask(plugins.webServer(cfg));
    };

    return builder;
};

function webpackConfig(c, uglify, builder) {

    var cfg = typeof c === "string" ? {
        entry: builder.config.src + c,
        output: {
            filename: c.split("/").pop()
        }
    } : builder.config;

    if (uglify) {
        if (!cfg.plugins) {
            cfg.plugins = [];
        }
        cfg.plugins.push(new plugins.webpack.webpack.optimize.UglifyJsPlugin({
            minimize: true
        }));
    }

    return cfg;
}