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

  debug(`Adding REST provider for service \`${path}\` at base route \`${uri}\``);

  // GET / -> service.find(cb, params)
  baseRoute.get(wrappers.find);
  // POST / -> service.create(data, params, cb)
  baseRoute.post(wrappers.create);
  // PATCH / -> service.patch(null, data, params)
  baseRoute.patch(wrappers.patch);
  // PUT / -> service.update(null, data, params)
  baseRoute.put.apply(wrappers.update);
  // DELETE / -> service.remove(null, params)
  baseRoute.delete.apply(wrappers.remove);

  // GET /:id -> service.get(id, params, cb)
  idRoute.get.apply(wrappers.get);
  // PUT /:id -> service.update(id, data, params, cb)
  idRoute.put.apply(wrappers.update);
  // PATCH /:id -> service.patch(id, data, params, callback)
  idRoute.patch.apply(wrappers.patch);
  // DELETE /:id -> service.remove(id, params, cb)
  idRoute.delete.apply(wrappers.remove);

  return function (req, res, next) {

    req.payloads = { provider: 'rest' };

    next();
  };
}

