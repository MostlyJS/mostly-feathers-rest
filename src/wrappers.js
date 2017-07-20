import fp from 'ramda';
import makeDebug from 'debug';

const debug = makeDebug('mostly:feathers:rest:wrappers');

const statusCodes = {
  created: 201,
  noContent: 204,
  methodNotAllowed: 405
};

const allowedMethods = {
  find:   'GET',
  get:    'GET',
  create: 'POST',
  update: 'PUT',
  patch:  'PATCH',
  remove: 'DELETE'
};

// A function that returns the middleware for a given method
// `getArgs` is a function that should return additional leading service arguments
function getHandler (method, getArgs, trans) {
  return function (req, res, next) {
    res.setHeader('Allow', Object.values(allowedMethods).join(','));

    let params = Object.assign({}, req.params || {});
    delete params.__service;
    delete params.__id;

    req.feathers = { provider: 'rest' };
    // Grab the service parameters. Use req.feathers and set the query to req.query

    let query = req.query || {};
    let headers = fp.dissoc('cookie', req.headers || {});
    let cookies = req.cookies || {};

    params = Object.assign({ query, headers }, params, req.feathers);

    // Transfer the received file
    if (req.file) {
      params.file = req.file;
    }

    // Run the getArgs callback, if available, for additional parameters
    const [service, ...args] = getArgs(req, res, next);

    debug(`REST handler calling service \'${service}\'`);
    debug(` => cmd  \'${method}\'`);
    debug(` => path \'${req.path}\'`);
    debug(` => args`, args);
    debug(` => params`, params);
    debug(` => feathers`, req.feathers);
    
    console.time(`  mostly:feathers:rest => ${service}.${method}`);

    // The service success callback which sets res.data or calls next() with the error
    const callback = function (err, data) {
      debug(' => service response:', err, data);
      console.timeEnd(`  mostly:feathers:rest => ${service}.${method}`);
      if (err) return next(err.cause || err);

      res.data = data;

      if (!data) {
        debug(`No content returned for '${req.url}'`);
        res.status(statusCodes.noContent);
      } else if (method === 'create') {
        res.status(statusCodes.created);
      }

      return next();
    };

    trans.act({
      topic: `feathers.${service}`,
      cmd: method,
      path: req.path,
      args: args,
      params: params,
      feathers: req.feathers
    }, callback);
  };
}

// Returns no leading parameters
function reqNone (req) {
  return [ req.params.__service ];
}

// Returns the leading parameters for a `get` or `remove` request (the id)
function reqId (req) {
  return [ req.params.__service, req.params.__id || null ];
}

// Returns the leading parameters for an `update` or `patch` request (id, data)
function reqUpdate (req) {
  return [ req.params.__service, req.params.__id || null, req.body ];
}

// Returns the leading parameters for a `create` request (data)
function reqCreate (req) {
  return [ req.params.__service, req.body ];
}

// Returns wrapped middleware for a service method.
export default {
  find: getHandler.bind(null, 'find', reqNone),
  get: getHandler.bind(null, 'get', reqId),
  create: getHandler.bind(null, 'create', reqCreate),
  update: getHandler.bind(null, 'update', reqUpdate),
  patch: getHandler.bind(null, 'patch', reqUpdate),
  remove: getHandler.bind(null, 'remove', reqId)
};
