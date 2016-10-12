import path from 'path';
import fs from 'fs';
import express from 'express';
import { Api } from './api';

// TODO: Set the locale in the api requests instead of a static value in the middleware config

async function handleDataRequest (dataType, req, res, next) {
  try {
    // 'this' is bound to an Api instance
    const data = await this.api.getData(dataType, req.params.id);
    res.send(JSON.stringify(data));
  } catch (err) {
    res.send(JSON.stringify({ err: err.message }));
  }
  next();
}

function createRouter (apiKey, region, route, opts) {
  // Format the params in an object for future routes
  const params = { apiKey: apiKey, region, region, route: route, opts: opts || {} };
  if (!params.apiKey) {
    throw new Error('api key undefined');
  }
  if (!params.region) {
    throw new Error('region undefined');
  }

  const router = express.Router();
  const api = new Api(params.apiKey, params.region, { protocol: opts.protocol, locale: opts.locale });
  const sources = api.getSources();
  for (let source of sources) {
    router.get(`/${source}/:id`, (...params) => {
      handleDataRequest.call({ api: api }, source, ...params);
    });
  }
  router.get('/patch', async (req, res, next) => {
    try {
      const data = await api.getPatchVersion();
      res.send({ patch: data });
    } catch (err) {
      res.send(JSON.stringify({ err: err.message }));
    }
    next();
  });

  const fileName = opts.fileName || 'league-tips.min.js';
  const originalClientFile = fs.readFileSync(path.resolve(__dirname, '../client', 'league-tips.min.js'), { encoding: 'utf-8' });
  const clientFile = originalClientFile.replace('$BASE_ROUTE', `'${params.route}'`);
  router.get('/' + fileName, (req, res, next) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(clientFile);
  });
  router.use('/html/loading.html', (req, res, next) => {
    res.sendFile(path.resolve(__dirname, '../client/views', `loading.html`));
  });
  router.use('/html/error.html', (req, res, next) => {
    res.sendFile(path.resolve(__dirname, '../client/views', `error.html`));
  });
  router.get('/html/:type.html', (req, res, next) => {
    res.sendFile(path.resolve(__dirname, '../client/views', `tooltip-${req.params.type}.html`));
  });
  router.use('/assets', express.static(path.resolve(__dirname, '../client/assets')));
  router.use('/styles', express.static(path.resolve(__dirname, '../client/styles')));
  return router;
}

export { createRouter };
