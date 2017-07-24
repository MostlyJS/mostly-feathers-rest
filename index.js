if (!global._babelPolyfill) { require('babel-polyfill'); }

module.exports = require('./lib/index');
module.exports.profiler = require('./lib/profiler');
module.exports.localStorage = require('./lib/upload/local_storage');
