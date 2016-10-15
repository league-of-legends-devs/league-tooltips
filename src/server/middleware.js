import express from 'express';
import Debug from 'debug';
import path from 'path';
import { createRouter } from './router';

const debug = Debug('league-tooltips:middleware');

export default function (apiKey, region, opts = {}) {
  debug('Init middleware', region);
  const url = opts.url || '';
  const route = ('/' + path.parse(url).base) || '/';
  debug('Base route', route);

  debug('Initializing base router');
  const router = express.Router();
  router.use(route, createRouter(apiKey, region, route, opts));
  debug('Initialized base router');

  debug(`Serving the tooltips on ${route}`);

  return router;
};
