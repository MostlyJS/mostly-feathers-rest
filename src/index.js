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

  // patch configure
  app.configure = function(fn) {
    fn && fn.call(app, app);
    return app;
  };

  app.service = function (name) {
    return new DefaultService({ name, trans });
  };

  return function (req, res, next) {
    next();
  };
}

