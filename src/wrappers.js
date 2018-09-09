const makeDebug = require('debug');
const fp = require('mostly-func');

const debug = makeDebug('mostly:feathers-rest:wrappers');

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
function getHandler (method, getArgs, trans, domain = 'feathers') {
  return function (req, res, next) {
    res.setHeader('Allow', Object.values(allowedMethods).join(','));

    let params = Object.assign({}, req.params || {});
    delete params.service;
    delete params.id;
    delete params.subresources;
    delete params[0];

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

    // method override
    if (method === 'update' 
      && params.query.$method 
      && params.query.$method.toLowerCase() === 'patch') {
      method = 'patch'
    }

    // Run the getArgs callback, if available, for additional parameters
    const [service, ...args] = getArgs(req, res, next);

    debug(`REST handler calling service \'${service}\'`, {
      cmd: method,
      path: req.path,
      //args: args,
      //params: params,
      //feathers: req.feathers
    });

    // The service success callback which sets res.data or calls next() with the error
    const callback = function (err, data) {
      debug(`${service}.${method} response:`, err || {
        status: data && data.status,
        size: data && JSON.stringify(data).length
      });
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
      topic: `${domain}.${service}`,
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
  return [ req.params.service ];
}

// Returns the leading parameters for a `get` or `remove` request (the id)
function reqId (req) {
  return [ req.params.service, fp.parseNil(req.params.id) ];
}

// Returns the leading parameters for an `update` or `patch` request (id, data)
function reqUpdate (req) {
  return [ req.params.service, fp.parseNil(req.params.id), req.body ];
}

// Returns the leading parameters for a `create` request (data)
function reqCreate (req) {
  return [ req.params.service, req.body ];
}

// Returns no leading parameters subresources
function subNone (req) {
  return [ req.params.service + '/' + req.params.subresources ];
}

// Returns the leading parameters for a `get` or `remove` subresources (the id)
function subId (req) {
  return [ req.params.service + '/' + req.params.subresources, fp.parseNil(req.params.id) ];
}

// Returns the leading parameters for an `update` or `patch` subresources (id, data)
function subUpdate (req) {
  return [ req.params.service + '/' + req.params.subresources, fp.parseNil(req.params.id), req.body ];
}

// Returns the leading parameters for a `create` subresources (data)
function subCreate (req) {
  return [ req.params.service + '/' + req.params.subresources, req.body ];
}

// Returns wrapped middleware for a service method.
module.exports = {
  find: getHandler.bind(null, 'find', reqNone),
  get: getHandler.bind(null, 'get', reqId),
  create: getHandler.bind(null, 'create', reqCreate),
  update: getHandler.bind(null, 'update', reqUpdate),
  patch: getHandler.bind(null, 'patch', reqUpdate),
  remove: getHandler.bind(null, 'remove', reqId),
  subresources: {
    find: getHandler.bind(null, 'find', subNone),
    get: getHandler.bind(null, 'get', subId),
    create: getHandler.bind(null, 'create', subCreate),
    update: getHandler.bind(null, 'update', subUpdate),
    patch: getHandler.bind(null, 'patch', subUpdate),
    remove: getHandler.bind(null, 'remove', subId),
  }
};
