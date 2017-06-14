import makeDebug from 'debug';
import wrappers from './wrappers';
import { DefaultService } from 'mostly-feathers';

const debug = makeDebug('mostly:feathers:rest');

function formatter(req, res, next) {
  if (res.data === undefined) {
    return next();
  }

  res.format({
    'application/json': function () {
      res.json(res.data);
    }
  });
}

export default function rest(app, trans, path, handler = formatter) {
  // Register the REST provider
  const uri = path || '';
  const baseRoute = app.route(`${uri}/:__service`);
  const idRoute = app.route(`${uri}/:__service/:__id`);
  const actionRoute = app.route(`${uri}/:__service/:__id/:__action`);

  debug(`Adding REST handler for service route \`${uri}\``);

  // GET / -> find(cb, params)
  baseRoute.get(wrappers.find(trans), handler);
  // POST / -> create(data, params, cb)
  baseRoute.post(wrappers.create(trans), handler);
  // PATCH / -> patch(null, data, params)
  baseRoute.patch(wrappers.patch(trans), handler);
  // PUT / -> update(null, data, params)
  baseRoute.put(wrappers.update(trans), handler);
  // DELETE / -> remove(null, params)
  baseRoute.delete(wrappers.remove(trans), handler);

  // GET /:id -> get(id, params, cb)
  idRoute.get(wrappers.get(trans), handler);
  // PUT /:id -> update(id, data, params, cb)
  idRoute.put(wrappers.update(trans), handler);
  // PATCH /:id -> patch(id, data, params, callback)
  idRoute.patch(wrappers.patch(trans), handler);
  // DELETE /:id -> remove(id, params, cb)
  idRoute.delete(wrappers.remove(trans), handler);

  // GET /:id -> action(id, params, cb)
  actionRoute.get(wrappers.get(trans), handler);
  // PUT /:id -> action(id, data, params, cb)
  actionRoute.put(wrappers.update(trans), handler);
  // PATCH /:id -> action(id, data, params, callback)
  actionRoute.patch(wrappers.patch(trans), handler);

  // patch configure
  app.configure = function(fn) {
    fn && fn.call(app, app);
    return app;
  };

  app.service = function (name) {
    return new DefaultService({ name, trans });
  };

  app.setup = function() {
    return app;
  };

  const _superUse = app.use;
  app.use = function(fn) {
    let offset = 0;

    if (typeof fn !== 'function') {
      var arg = fn;

      while (Array.isArray(arg) && arg.length !== 0) {
        arg = arg[0];
      }

      // first arg is the path
      if (typeof arg !== 'function') {
        offset = 1;
      }
    }
    var service = arguments[offset];
    if (typeof service !== 'function') {
      return app;
    } else {
      return _superUse.apply(app, arguments);
    }
  };

  const _superListen = app.listen;
  app.listen = function() {
    const server = _superListen.apply(this, arguments);

    app.setup(server);

    return server;
  };

  app.feathers = {};

  return function (req, res, next) {
    req.feathers = { provider: 'rest' };
    next();
  };
}

