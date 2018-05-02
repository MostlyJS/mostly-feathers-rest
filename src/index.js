import makeDebug from 'debug';
import wrappers from './wrappers';
import { ProxyService } from 'mostly-feathers';

const debug = makeDebug('mostly:feathers-rest');

function formatter (req, res, next) {
  if (res.data === undefined) {
    return next();
  }

  res.format({
    'application/json': function () {
      res.json(res.data);
    }
  });
}

export default function rest (app, trans, path, domain = 'feathers', handler = formatter) {
  // Register the REST provider
  const uri = path || '';
  const baseRoute = app.route(`${uri}/:service`);
  const idRoute = app.route(`${uri}/:service/:id`);
  const actionRoute = app.route(`${uri}/:service/:id/:action`);
  const actionBaseRoute = app.route(`${uri}/:service/:sid/:action`);
  const actionIdRoute = app.route(`${uri}/:service/:sid/:action/:id(*)`);

  debug(`Adding REST handler for service route \`${uri}\``);

  // GET / -> find(params, cb)
  baseRoute.get(wrappers.find(trans, domain), handler);
  // POST / -> create(data, params, cb)
  baseRoute.post(wrappers.create(trans, domain), handler);
  // PUT / -> update(null, data, params)
  baseRoute.put(wrappers.update(trans, domain), handler);
  // PATCH / -> patch(null, data, params)
  baseRoute.patch(wrappers.patch(trans, domain), handler);
  // DELETE / -> remove(null, params)
  baseRoute.delete(wrappers.remove(trans, domain), handler);

  // GET /:id -> get(id, params, cb)
  idRoute.get(wrappers.get(trans, domain), handler);
  // PUT /:id -> update(id, data, params, cb)
  idRoute.put(wrappers.update(trans, domain), handler);
  // PATCH /:id -> patch(id, data, params, callback)
  idRoute.patch(wrappers.patch(trans, domain), handler);
  // DELETE /:id -> remove(id, params, cb)
  idRoute.delete(wrappers.remove(trans, domain), handler);

  // PUT /:sid/:action -> action(id, data, params, cb)
  actionRoute.put(wrappers.update(trans, domain), handler);
  // PATCH /:sid/:action -> action(id, data, params, callback)
  actionRoute.patch(wrappers.patch(trans, domain), handler);
  // DELETE /:sid/:action -> action(id, params, callback)
  actionRoute.delete(wrappers.remove(trans, domain), handler);

  // GET /:sid/:action -> find(params, cb)
  actionBaseRoute.get(wrappers.action.find(trans, domain), handler);
  // POST /:sid/:action -> create(data, params, cb)
  actionBaseRoute.post(wrappers.action.create(trans, domain), handler);

  // GET /:sid/:action/:id -> get(id, params, cb)
  actionIdRoute.get(wrappers.action.get(trans, domain), handler);
  // PUT /:sid/:action/:id -> update(id, data, params, cb)
  actionIdRoute.put(wrappers.action.update(trans, domain), handler);
  // PATCH /:sid/:action/:id -> patch(id, data, params, callback)
  actionIdRoute.patch(wrappers.action.patch(trans, domain), handler);
  // DELETE /:sid/:action/:id -> remove(id, params, callback)
  actionIdRoute.delete(wrappers.action.remove(trans, domain), handler);

  // patch configure
  app.configure = function (fn) {
    fn && fn.call(app, app);
    return app;
  };

  app.service = function (name) {
    return new ProxyService({ name, domain, trans });
  };

  app.setup = function () {
    return app;
  };

  const _superUse = app.use;
  app.use = function (fn) {
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
  app.listen = function () {
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

