import express from 'express';
import path from 'path';
import { createRouter } from './router';

export default function (apiKey, region, opts = {}) {
  const url = opts.url; // domain.tld/route
  // TODO: Ensure url is valid
  const route = ('/' + path.parse(url).base) || '/';
  // TODO: Check route

  const router = express.Router();
  router.use(route, createRouter(apiKey, region, route, opts));

  if (process.env.NODE_ENV !== 'production') {
    console.log(`Serving the tooltips on ${route}`);
  }

  return router;
};
