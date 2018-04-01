require = require("esm")(module/*, options*/);
console.time('mostly-feathers-rest import');
module.exports = require('./src/index').default;
module.exports.ping = require('./src/ping').default;
module.exports.profiler = require('./src/profiler').default;
console.timeEnd('mostly-feathers-rest import');
