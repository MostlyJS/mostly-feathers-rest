if (!global._babelPolyfill) { require('babel-polyfill'); }

module.exports = require('./lib/index');
module.exports.ping = require('./lib/ping');
module.exports.profiler = require('./lib/profiler');
