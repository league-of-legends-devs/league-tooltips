import express from 'express';
import Debug from 'debug';
import path from 'path';
import Router from './router';

const debug = Debug('league-tooltips:middleware');

export default (apiKey, region, opts = {}) => {
  debug('Init middleware', region);
  const rawRoute = opts.url || '/';
  const parsedRoute = path.parse(rawRoute).base;
  const route = `${parsedRoute}/`;

  debug('Route', route);

  debug('Initializing base router');
  const router = express();
  router.use(route, (req, res, next) => {
    debug('App mount path', req.app.mountpath);
    // Include the mount path of the application in the middleware route
    res.locals.tooltipsRoute = path.join(req.app.mountpath, route);
    next();
  });
  const routerMiddleware = new Router(apiKey, region, route, opts);
  router.use(route, routerMiddleware.create());
  debug('Initialized base router');

  debug(`Serving the tooltips on ${route}`);

  return router;
};
