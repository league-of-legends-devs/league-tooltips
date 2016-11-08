import path from 'path';
import fs from 'fs';
import Debug from 'debug';
import _ from 'lodash';
import express from 'express';
import Api from './api';

const debug = Debug('league-tooltips:router');

const MODULE_VERSION = require('../../package.json').version;

const handleDataRequest = async function handleDataRequest(dataType, req, res, next) {
  debug('Handling data request', dataType, req.params.id);
  const locale = req.query.locale;
  try {
    // 'this' is bound to an Api instance
    const data = await this.api.getData(dataType, req.params.id, locale);
    res.send(JSON.stringify(data));
    debug('Datas sent');
  } catch (err) {
    res.send(JSON.stringify({ err: err.message }));
    debug('Error', err.message, err.stack);
  }
  next();
};

const allowCrossDomain = (cors = {}) => {
  debug('allowCrossDomain() call', cors.origin, cors.methods, cors.headers);
  return (req, res, next) => {
    debug('CORS header set');
    res.header('Access-Control-Allow-Origin', cors.origin || '*');
    res.header('Access-Control-Allow-Methods', cors.methods || 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', cors.headers || 'Content-Type');
    next();
  };
};

class Router {
  constructor(apiKey, region, route, opts) {
    debug('Initializing router');

    if (!apiKey) {
      throw new Error('api key undefined');
    }
    if (!region) {
      throw new Error('region undefined');
    }
    if (!route) {
      throw new Error('route undefined');
    }

    this.apiKey = apiKey;
    this.region = region;
    this.route = route;
    this.opts = opts || {};

    debug('Initializing API');
    this.api = new Api(this.apiKey, this.region, {
      protocol: this.opts.protocol,
      cache: this.opts.cache,
    });
    debug('Initialized API');

    debug('Initialized router');
  }

  create() {
    debug('init() call', this.region, this.route);

    debug('Initializing main router');
    const router = express.Router();

    if (this.opts.cors) {
      debug('Allowing CORS');
      router.use(allowCrossDomain(this.opts.cors));
    }

    debug('Serving static files');
    router.use('/assets', express.static(path.resolve(__dirname, '../client/assets')));
    router.use('/styles', express.static(path.resolve(__dirname, '../client/styles')));
    debug('Served static files');

    debug('Serving version route');

    debug('Served version route');
    router.get('/version', (req, res, next) => {
      debug('Serving version', MODULE_VERSION);
      res.send({ version: MODULE_VERSION });
      next();
    });
    debug('Serving datas routes');
    const sources = this.api.getSources();
    _.values(sources).forEach((source) => {
      debug(`Serving ${source} route`);
      router.get(`/${source}/:id`, (...prms) => {
        handleDataRequest.call({ api: this.api }, source, ...prms);
      });
      debug(`Served ${source} route`);
    });
    debug('Serving patch route');
    router.get('/patch', async (req, res, next) => {
      debug('Serving patch version');
      try {
        const data = await this.api.getPatchVersion();
        res.send({ patch: data });
      } catch (err) {
        res.send(JSON.stringify({ err: err.message }));
      }
      next();
    });
    debug('Served patch route');
    debug('Serving locales route');
    router.get('/locale/:locale', async (req, res, next) => {
      debug('Serving locale', req.params.locale);
      const locale = req.params.locale;
      try {
        const data = await this.api.getLocale(locale);
        res.send({ locale: data });
      } catch (err) {
        res.send(JSON.stringify({ err: err.message }));
      }
      next();
    });
    debug('Served locales route');
    debug('Served datas routes');

    const fileName = this.opts.fileName || 'league-tips.min.js';
    const originalClientFile = fs.readFileSync(path.resolve(__dirname, '../client', 'league-tips.min.js'), { encoding: 'utf-8' });
    const clientFile = originalClientFile.replace('$BASE_ROUTE', `'${this.route}'`);
    debug(`Serving ${fileName} with ${this.route} as $BASE_ROUTE`);
    router.get(`/${fileName}`, (req, res) => {
      debug('Serving', fileName);
      res.setHeader('Content-Type', 'application/javascript');
      res.send(clientFile);
    });
    router.get(`/${fileName}.map`, (req, res) => {
      debug('Serving source map', fileName);
      res.setHeader('Content-Type', 'application/javascript');
      res.send(fs.readFileSync(path.resolve(__dirname, '../client', 'league-tips.min.js.map'), { encoding: 'utf-8' }));
    });
    debug(`Served ${fileName}`);
    debug('Serving views');
    router.use('/html/loading.html', (req, res) => {
      debug('Serving', 'loading.html');
      res.sendFile(path.resolve(__dirname, '../client/views', 'loading.html'));
    });
    router.use('/html/error.html', (req, res) => {
      debug('Serving', 'error.html');
      res.sendFile(path.resolve(__dirname, '../client/views', 'error.html'));
    });
    router.get('/html/:type.html', (req, res) => {
      debug('Serving', `${req.params.type}.html`);
      res.sendFile(path.resolve(__dirname, '../client/views', `tooltip-${req.params.type}.html`));
    });
    debug('Served views');

    debug('Initialized main router');

    return router;
  }
}

export default Router;
