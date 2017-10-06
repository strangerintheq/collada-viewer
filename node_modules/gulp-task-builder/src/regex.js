'use strict';

const gutil = require('gulp-util');
const through = require('through2');

module.exports = function (regex, name) {

    return through.obj(handle);

    function handle(file, enc, callbackFunc) {

        if (file.isNull()) {
            callbackFunc(null, file);
            return;
        }

        if (file.isStream()) {
            callbackFunc(error('streaming not supported'));
            return;
        }

        try {
            var data = file.contents.toString();
            var arr = data.split(regex);
            data = arr.join('');
            file.contents = new Buffer(data);
            this.push(file);
            if (name) {
                console.log("regex '" + name + "' occurrences removed: " + (arr.length - 1));
            }
        } catch (e) {
            this.emit('error', error(e));
        }

        callbackFunc();
    }
};
function error(e) {
    return new gutil.PluginError('gulp-custom-plugin', e);
}
