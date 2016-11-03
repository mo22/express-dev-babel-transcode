#express-dev-babel-transcode

## Example Usage

    var app = ...
    app.use(require('express-dev-babel-transcode')({}));

automatically catches respones and transpiles application/javascript and text/html <script> tags
if they start with 'use babel'

