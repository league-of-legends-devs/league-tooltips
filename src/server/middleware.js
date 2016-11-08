import express from 'express';
import Debug from 'debug';
import path from 'path';
import url from 'url';
import Router from './router';

const debug = Debug('league-tooltips:middleware');

export default (apiKey, region, opts = {}) => {
  debug('Init middleware', region);
  const baseRoute = opts.base || '/';
  const baseUrl = opts.url || '/';

  const baseRouteBase = path.parse(baseRoute).base;
  const baseUrlBase = path.parse(baseUrl).base;
  // eslint-disable-next-line prefer-template
  const route = '/' + url.resolve(
    baseRouteBase ? (`${baseRouteBase}/`) : '',
    baseUrlBase ? (`${baseUrlBase}/`) : '',
  );
  debug('Base route', baseRoute);
  debug('Route', route);

  debug('Initializing base router');
  const router = express.Router();
  const routerMiddleware = new Router(apiKey, region, route, opts);
  router.use(baseUrl, routerMiddleware.create());
  debug('Initialized base router');

  debug(`Serving the tooltips on ${route}`);

  return router;
};
