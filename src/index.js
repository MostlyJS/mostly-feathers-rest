import makeDebug from 'debug';
import wrappers from './wrappers';

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

export default function rest(app, mostly, path, handler = formatter) {
  // Register the REST provider
  const uri = path || '';
  const baseRoute = app.route(`${uri}/:__service`);
  const idRoute = app.route(`${uri}/:__service/:__id`);

  debug(`Adding REST handler for service route \`${uri}\``);

  // GET / -> find(cb, params)
  baseRoute.get(wrappers.find(mostly), handler);
  // POST / -> create(data, params, cb)
  baseRoute.post(wrappers.create(mostly), handler);
  // PATCH / -> patch(null, data, params)
  baseRoute.patch(wrappers.patch(mostly), handler);
  // PUT / -> update(null, data, params)
  baseRoute.put(wrappers.update(mostly), handler);
  // DELETE / -> remove(null, params)
  baseRoute.delete(wrappers.remove(mostly), handler);

  // GET /:id -> get(id, params, cb)
  idRoute.get(wrappers.get(mostly), handler);
  // PUT /:id -> update(id, data, params, cb)
  idRoute.put(wrappers.update(mostly), handler);
  // PATCH /:id -> patch(id, data, params, callback)
  idRoute.patch(wrappers.patch(mostly), handler);
  // DELETE /:id -> remove(id, params, cb)
  idRoute.delete(wrappers.remove(mostly), handler);

  return function (req, res, next) {

    req.feathers = { provider: 'rest' };

    next();
  };
}

