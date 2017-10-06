var TaskBuilder = require('gulp-task-builder');

TaskBuilder.task('libs')
    .webpack('libs.js', false)
    .dest();

TaskBuilder.task('editor')
    .src('editor.js')
    // .webpack('editor.js', false)
    .dest();

TaskBuilder
    .task('default')
    .depends([
        'libs',
        'editor'
    ])
    .src('../html/index.html')
    .dest();

