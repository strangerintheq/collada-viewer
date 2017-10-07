var TaskBuilder = require('gulp-task-builder');

TaskBuilder.task('editor')
    .webpack('editor.js', false)
    .dest();

TaskBuilder
    .task('default')
    .depends([

        'editor'
    ])
    .src('../html/index.html')
    .dest();

