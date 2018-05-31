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

export default function rest (app, trans, path, customServices = [], domain = 'feathers', handler = formatter) {
  // Register the REST provider
  const uri = path || '';

  debug(`REST handler for service route \`${uri}\``);

  /** base route **/
  const baseRoute = app.route(`${uri}/:service`)
    // GET / -> find(params, cb)
    .get(wrappers.find(trans, domain), handler)
    // POST / -> create(data, params, cb)
    .post(wrappers.create(trans, domain), handler)
    // PUT / -> update(null, data, params)
    .put(wrappers.update(trans, domain), handler)
    // PATCH / -> patch(null, data, params)
    .patch(wrappers.patch(trans, domain), handler)
    // DELETE / -> remove(null, params)
    .delete(wrappers.remove(trans, domain), handler);

  /** route for custom services that handle the route themselves **/
  for (const service of customServices) {
    const customRoute = app.route(`${uri}/:service(${service})/:id(*)`)
      // GET /:id -> get(id, params, cb)
      .get(wrappers.get(trans, domain), handler)
      // PUT /:id -> update(id, data, params, cb)
      .put(wrappers.update(trans, domain), handler)
      // PATCH /:id -> patch(id, data, params, callback)
      .patch(wrappers.patch(trans, domain), handler)
      // DELETE /:id -> remove(id, params, cb)
      .delete(wrappers.remove(trans, domain), handler);
  }

  /** id route **/
  const idRoute = app.route(`${uri}/:service/:id`)
    // GET /:id -> get(id, params, cb)
    .get(wrappers.get(trans, domain), handler)
    // PUT /:id -> update(id, data, params, cb)
    .put(wrappers.update(trans, domain), handler)
    // PATCH /:id -> patch(id, data, params, callback)
    .patch(wrappers.patch(trans, domain), handler)
    // DELETE /:id -> remove(id, params, cb)
    .delete(wrappers.remove(trans, domain), handler);

  /** action route */
  const actionRoute = app.route(`${uri}/:service/:id/:action`)
    // PUT /:primary/:action -> action(id, data, params, cb)
    .put(wrappers.update(trans, domain), handler)
    // PATCH /:primary/:action -> action(id, data, params, callback)
    .patch(wrappers.patch(trans, domain), handler)
    // DELETE /:primary/:action -> action(id, params, callback)
    .delete(wrappers.remove(trans, domain), handler);

  /** subresources base route */
  const subBaseRoute = app.route(`${uri}/:service/:primary/:subresources`)
    // GET /:primary/:subresources -> find(params, cb)
    .get(wrappers.subresources.find(trans, domain), handler)
    // POST /:primary/:subresources -> create(data, params, cb)
    .post(wrappers.subresources.create(trans, domain), handler);

  /** subresources id route */
  const subIdRoute = app.route(`${uri}/:service/:primary/:subresources/:id`)
    // GET /:primary/:subresources/:id -> get(id, params, cb)
    .get(wrappers.subresources.get(trans, domain), handler)
    // PUT /:primary/:subresources/:id -> update(id, data, params, cb)
    .put(wrappers.subresources.update(trans, domain), handler)
    // PATCH /:primary/:subresources/:id -> patch(id, data, params, callback)
    .patch(wrappers.subresources.patch(trans, domain), handler)
    // DELETE /:primary/:subresources/:id -> remove(id, params, callback)
    .delete(wrappers.subresources.remove(trans, domain), handler);

  /** subresources action route */
  const subActionRoute = app.route(`${uri}/:service/:primary/:subresources/:id/:action(*)`)
    // PUT /:primary/:subresources/:id/:action -> action(id, data, params, cb)
    .put(wrappers.subresources.update(trans, domain), handler)
    // PATCH /:primary/:subresources/:id/:action -> action(id, data, params, callback)
    .patch(wrappers.subresources.patch(trans, domain), handler)
    // DELETE /:primary/:subresources/:id/:action -> action(id, params, callback)
    .delete(wrappers.subresources.remove(trans, domain), handler);
  
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

