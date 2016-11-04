const expressModifyResponse = require('express-modify-response');
const babel = require('babel-core');
const htmlparser2 = require('htmlparser2');
const stripAnsi = require('strip-ansi');

function transcode(source, opts) {
    try {
        var result = babel.transform(source, opts);
        return result.code + '\n/* express-dev-babel-transcode */\n';
    } catch (e) {
        console.log(e.stack);
        return 'console.log('+JSON.stringify(stripAnsi(e.stack))+');'
    }
}

module.exports = function expressDevBabelTranscode(options) {
    return expressModifyResponse(
        function(req, res) {
            if (res.getHeader('Content-Type') && res.getHeader('Content-Type').startsWith('application/javascript')) {
                return true;
            }
            if (res.getHeader('Content-Type') && res.getHeader('Content-Type').startsWith('text/html')) {
                return true;
            }
            return false;
        },
        function(req, res, body) {
            var opts = {
                filenameRelative: req.path,
                sourceRoot: process.cwd(),
                filename: process.cwd() + '/' + req.path
            };
            body = body.toString();
            if (res.getHeader('Content-Type').startsWith('text/html')) {
                var content = undefined;
                var parts = [];
                var parser = new htmlparser2.Parser({
                    onopentag: (name, attribs) => {
                        if (name == 'script') {
                            content = '';
                        }
                    },
                    ontext: (text) => {
                        if (content === undefined) return;
                        content += text;
                    },
                    onclosetag: (name) => {
                        if (name == 'script') {
                            parts.push(content);
                            content = undefined;
                        }
                    }
                });
                parser.write(body);
                parser.end();
                for (var part of parts) {
                    if (!part.trim().startsWith("'use babel'")) continue;
                    body = body.replace(part, transcode(part, opts));
                }
            } else if (body.trim().startsWith("'use babel'")) {
                return transcode(body, opts);
            }
            return body;
        }
    );
};
