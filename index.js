require = require("esm")(module/*, options*/);
module.exports = require('./src/index').default;
module.exports.ping = require('./src/ping').default;
module.exports.profiler = require('./src/profiler').default;
