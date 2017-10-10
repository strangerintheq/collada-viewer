var TaskBuilder = require('gulp-task-builder');

TaskBuilder.task('editor')
    .webpack('editor.js', true)
    .dest();

TaskBuilder
    .task('default')
    .depends([

        'editor'
    ])
    .src('../html/index.html')
    .dest();

