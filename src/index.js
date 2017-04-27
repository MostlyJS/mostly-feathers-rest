import makeDebug from 'debug';
import wrappers from './wrappers';

const debug = makeDebug('mostly:rest');

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

export default function rest(app, path = '/', handler = formatter) {
  // Register the REST provider
  const uri = path.indexOf('/') === 0 ? path : `/${path}`;
  const baseRoute = app.route(`${uri}:__service`);
  const idRoute = app.route(`${uri}:__service/:__id`);

  debug(`Adding REST handler for service route \`${uri}\``);

  // GET / -> find(cb, params)
  baseRoute.get(wrappers.find);
  // POST / -> create(data, params, cb)
  baseRoute.post(wrappers.create);
  // PATCH / -> patch(null, data, params)
  baseRoute.patch(wrappers.patch);
  // PUT / -> update(null, data, params)
  baseRoute.put(wrappers.update);
  // DELETE / -> remove(null, params)
  baseRoute.delete(wrappers.remove);

  // GET /:id -> get(id, params, cb)
  idRoute.get(wrappers.get);
  // PUT /:id -> update(id, data, params, cb)
  idRoute.put(wrappers.update);
  // PATCH /:id -> patch(id, data, params, callback)
  idRoute.patch(wrappers.patch);
  // DELETE /:id -> remove(id, params, cb)
  idRoute.delete(wrappers.remove);

  return function (req, res, next) {

    req.payloads = { provider: 'rest' };

    next();
  };
}

