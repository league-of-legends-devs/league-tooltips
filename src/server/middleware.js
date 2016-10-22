import express from 'express';
import Debug from 'debug';
import path from 'path';
import url from 'url';
import { createRouter } from './router';

const debug = Debug('league-tooltips:middleware');

export default function (apiKey, region, opts = {}) {
  debug('Init middleware', region);
  const baseRoute = opts.base || '/';
  const baseUrl = opts.url || '/';
  const route = '/' + url.resolve(
    path.parse(baseRoute).base ? (path.parse(baseRoute).base + '/') : '',
    path.parse(baseUrl).base ? (path.parse(baseUrl).base + '/') : ''
  );
  debug('Base route', baseRoute);
  debug('Route', route);

  debug('Initializing base router');
  const router = express.Router();
  router.use(route, createRouter(apiKey, region, route, opts));
  debug('Initialized base router');

  debug(`Serving the tooltips on ${route}`);

  return router;
};
