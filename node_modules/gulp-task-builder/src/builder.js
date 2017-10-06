'use strict';

var gulp = require('gulp');
var pump = require('pump');
var plugins = require('./plugins');
var regexStrip = require('./regex');

var config = {
    src: './src/',
    dest: './bin/',
    temp: './temp/'
};

module.exports = {
    plugins: plugins,
    config: config,
    task: createTaskBuilder
};

function createTaskBuilder(name) {

    if (!name) {
        throw new Error('task must be named');
    }

    var dependencies = [];
    var tasks = [];

    var builder = {
        config: config,
        subTask: subTask
    };

    builder.depends = function (deps) {
        dependencies = deps;
        return builder;
    };

    builder.pump = function () {
        return gulp.task(name, dependencies, pumpCallback);
    };

    builder.src = function (path) {
        return subTask(gulp.src(srcFromPath(path)));
    };

    builder.temp = function () {
        return subTask(gulp.dest(config.temp)).pump();
    };

    builder.dest = function (path) {
        return subTask(gulp.dest(path ? path : config.dest)).pump();
    };

    builder.regex = function (regex, name) {
        return subTask(regexStrip(regex, name));
    };

    return plugins.extend(builder);

    function subTask(task) {
        tasks.push(task);
        return builder;
    }

    function pumpCallback(callback) {
        pump(tasks, callback);
    }
}

function srcFromPath (path) {
    if (typeof path === "string") {
        return config.src + (path || '');
    } else {
        return path.map(function (src) {
            return config.src + src;
        });
    }
}