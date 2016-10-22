import path from 'path';
import fs from 'fs';
import Debug from 'debug';
import express from 'express';
import { Api } from './api';

const debug = Debug('league-tooltips:router');

async function handleDataRequest (dataType, req, res, next) {
  debug('Handling data request', dataType, req.params.id);
  const locale = req.query.locale;
  try {
    // 'this' is bound to an Api instance
    const data = await this.api.getData(dataType, req.params.id, locale);
    res.send(JSON.stringify(data));
    debug('Datas sent');
  } catch (err) {
    res.send(JSON.stringify({ err: err.message }));
    debug('Error', err.mesage, err);
  }
  next();
}

function allowCrossDomain (cors = {}) {
  debug('allowCrossDomain() call', cors.origin, cors.methods, cors.headers);
  return function (req, res, next) {
    debug('CORS header set');
    res.header('Access-Control-Allow-Origin', cors.origin || '*');
    res.header('Access-Control-Allow-Methods', cors.methods || 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', cors.headers || 'Content-Type');
    next();
  };
};

function createRouter (apiKey, region, route, opts) {
  debug('createRouter() call', region, route);
  // Format the params in an object for future routes
  const params = { apiKey: apiKey, region, region, route: route, opts: opts || {} };
  if (!params.apiKey) {
    throw new Error('api key undefined');
  }
  if (!params.region) {
    throw new Error('region undefined');
  }

  debug('Initializing main router');
  const router = express.Router();

  if (opts.cors) {
    debug('Allowing CORS');
    router.use(allowCrossDomain(opts.cors));
  }

  debug('Serving static files');
  router.use('/assets', express.static(path.resolve(__dirname, '../client/assets')));
  router.use('/styles', express.static(path.resolve(__dirname, '../client/styles')));
  debug('Served static files');

  debug('Initializing API');
  const api = new Api(params.apiKey, params.region, {
    protocol: opts.protocol,
    cache: opts.cache
  });
  debug('Initialized API');

  debug('Serving version route');

  debug('Served version route');
  router.get('/version', (req, res, next) => {
    try {
      const version = require('../../package.json').version;
      res.send({ version: version });
    } catch (err) {
      res.send(JSON.stringify({ err: err.message }));
    }
    next();
  });
  debug('Serving datas routes');
  const sources = api.getSources();
  for (let source of sources) {
    debug(`Serving ${source} route`);
    router.get(`/${source}/:id`, (...params) => {
      handleDataRequest.call({ api: api }, source, ...params);
    });
    debug(`Served ${source} route`);
  }
  debug('Serving patch route');
  router.get('/patch', async (req, res, next) => {
    try {
      const data = await api.getPatchVersion();
      res.send({ patch: data });
    } catch (err) {
      res.send(JSON.stringify({ err: err.message }));
    }
    next();
  });
  debug('Served patch route');
  debug('Serving locales route');
  router.get('/locale/:locale', async (req, res, next) => {
    const locale = req.params.locale;
    try {
      const data = await api.getLocale(locale);
      res.send({ locale: data });
    } catch (err) {
      res.send(JSON.stringify({ err: err.message }));
    }
    next();
  });
  debug('Served locales route');
  debug('Served datas routes');

  const fileName = opts.fileName || 'league-tips.min.js';
  const originalClientFile = fs.readFileSync(path.resolve(__dirname, '../client', 'league-tips.min.js'), { encoding: 'utf-8' });
  const clientFile = originalClientFile.replace('$BASE_ROUTE', `'${params.route}'`);
  debug(`Serving ${fileName} with ${params.route} as $BASE_ROUTE`);
  router.get('/' + fileName, (req, res, next) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(clientFile);
  });
  router.get('/' + fileName + '.map', (req, res, next) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(fs.readFileSync(path.resolve(__dirname, '../client', 'league-tips.min.js.map'), { encoding: 'utf-8' }));
  });
  debug(`Served ${fileName}`);
  debug('Serving views');
  router.use('/html/loading.html', (req, res, next) => {
    res.sendFile(path.resolve(__dirname, '../client/views', `loading.html`));
  });
  router.use('/html/error.html', (req, res, next) => {
    res.sendFile(path.resolve(__dirname, '../client/views', `error.html`));
  });
  router.get('/html/:type.html', (req, res, next) => {
    res.sendFile(path.resolve(__dirname, '../client/views', `tooltip-${req.params.type}.html`));
  });
  debug('Served views');

  debug('Initialized main router');

  return router;
}

export { createRouter };
