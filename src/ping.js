import os from 'os';
import path from 'path';

function loadMainPackageJSON (attempts) {
  attempts = attempts || 1;
  if (attempts > 5) {
    throw new Error('Can\'t resolve main package.json file');
  }
  var mainPath = attempts === 1? './' : Array(attempts).join("../");
  try {
    return require.main.require(mainPath + 'package.json');
  } catch (e) {
    return loadMainPackageJSON(attempts + 1);
  }
}

var pjson = loadMainPackageJSON();
var DEFAULT_PATH = '/ping';

/**
 * Get system informaton
 * @param {Function} cb
 */
function info (cb) {
  var data = {
    name: pjson.name,
    message: 'pong',
    version: pjson.version,
    node_env: process.env.NODE_ENV,
    node_ver: process.versions.node,
    timestamp: Date.now(),
    hostname: os.hostname(),
    uptime: process.uptime(),
    loadavg: os.loadavg()[0]
  };

  cb(null, data);
}

/**
 * Ping health check express middleware
 * @param {String} path
 */
export default function ping (path) {
  path = path || DEFAULT_PATH;
  return function (req, res, next) {
    if (req.path === path) {
      info(function (err, data) {
        res.set('Content-Type', 'application/json');
        res.send(JSON.stringify(data, null, 2));
      });
    } else {
      next();
    }
  };
}

