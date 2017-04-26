import makeDebug from 'debug';

const debug = makeDebug('mostly:rest:wrappers');

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
function getHandler (method, getArgs) {
  return function (req, res, next) {
    res.setHeader('Allow', Object.values(allowedMethods).join(','));

    let params = Object.assign({}, req.params || {});
    delete params.__serivce;
    delete params.__id;

    // Grab the service parameters. Use req.payloads and set the query to req.query
    params = Object.assign({ query: req.query || {} }, params, req.payloads);

    // Run the getArgs callback, if available, for additional parameters
    const args = getArgs(req, res, next);

    // The service success callback which sets res.data or calls next() with the error
    const callback = function (error, data) {
      res.data = data;

      if (!data) {
        debug(`No content returned for '${req.url}'`);
        res.status(statusCodes.noContent);
      } else if (method === 'create') {
        res.status(statusCodes.created);
      }

      return next();
    };

    debug(`REST handler calling \`${method}\` from \`${req.url}\``);

    // TODO
    //service[method].apply(service, args.concat([ params, callback ]));
    callback(null, {});
  };
}

// Returns no leading parameters
function reqNone () {
  return [ req.params.__serivce ];
}

// Returns the leading parameters for a `get` or `remove` request (the id)
function reqId (req) {
  return [ req.params.__serivce, req.params.__id || null ];
}

// Returns the leading parameters for an `update` or `patch` request (id, data)
function reqUpdate (req) {
  return [ req.params.__serivce, req.params.__id || null, req.body ];
}

// Returns the leading parameters for a `create` request (data)
function reqCreate (req) {
  return [ req.params.__serivce, req.body ];
}

// Returns wrapped middleware for a service method.
export default {
  find: getHandler('find', reqNone),
  get: getHandler('get', reqId),
  create: getHandler('create', reqCreate),
  update: getHandler('update', reqUpdate),
  patch: getHandler('patch', reqUpdate),
  remove: getHandler('remove', reqId)
};
