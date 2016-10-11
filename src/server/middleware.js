import express from 'express';
import path from 'path';
import { createRouter } from './router';

export default function (apiKey, region, opts = {}) {
  const url = opts.url || '';
  const route = ('/' + path.parse(url).base) || '/';

  const router = express.Router();
  router.use(route, createRouter(apiKey, region, route, opts));

  if (process.env.NODE_ENV !== 'production') {
    console.log(`Serving the tooltips on ${route}`);
  }

  return router;
};
