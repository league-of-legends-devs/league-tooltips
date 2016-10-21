import path from 'path';
import Debug from 'debug';
import _ from 'lodash';
import { Client } from 'node-rest-client';
import Cache from 'node-cache';

const RIOT_API = 'global.api.pvp.net/api/lol/';

const debug = Debug('league-tooltips:api');

function linkAPI (protocol, route) {
  const url = protocol + '://' + path.join(RIOT_API, route);
  debug('Linking API', url);
  return url;
};

function createApiSources () {
  if (!this.protocol) {
    throw new Error('createApiSources() must be bound to an Api instance.');
  }
  // TODO: Cache the datas in a key-value set with 'link' as the key and the datas as the value
  return {
    'item': {
      link: linkAPI(this.protocol, 'static-data/${region}/v1.2/item/${id}'),
      args: {
        itemData: ['tags', 'image', 'gold'].join(',')
      }
    },
    'champion': {
      link: linkAPI(this.protocol, 'static-data/${region}/v1.2/champion/${id}'),
      args: {
        champData: ['tags', 'stats', 'image', 'passive', 'spells', 'info'].join(',')
      }
    },
    'summonerspell': {
      link: linkAPI(this.protocol, 'static-data/${region}/v1.2/summoner-spell/${id}'),
      args: {
        spellData: ['image', 'rangeBurn', 'cooldownBurn', 'modes'].join(',')
      }
    },
    'rune': {
      link: linkAPI(this.protocol, 'static-data/${region}/v1.2/rune/${id}'),
      args: {
        runeData: ['tags', 'image'].join(',')
      }
    },
    'mastery': {
      link: linkAPI(this.protocol, 'static-data/${region}/v1.2/mastery/${id}'),
      args: {
        masteryData: ['ranks', 'image', 'masteryTree'].join(',')
      }
    },
    'championspell': {
      beforeRequest: function () {
        // 'this' is bound to 'clientArgs'
        this.beforeId = this.path.id;
        this.path.id = this.path.id.split('.')[0];
        debug('championspell.beforeRequest().beforeId', this.beforeId);
        debug('championspell.beforeRequest().path.id', this.path.id);
      },
      afterRequest: function () {
        // 'this' is bound to the data retrieved and the 'clientArgs'
        const spells = ['Q', 'W', 'E', 'R'];
        const key = _.last(this.args.beforeId.split('.'));
        const index = _.indexOf(spells, key);
        if (index === -1) {
          throw new Error('Invalid spell key');
        }
        this.data = this.data.spells[index];
        debug('championspell.afterRequest().index', index);
        debug('championspell.afterRequest().key', key);
      },
      link: linkAPI(this.protocol, 'static-data/${region}/v1.2/champion/${id}'),
      args: {
        champData: ['tags', 'stats', 'image', 'passive', 'spells', 'info'].join(',')
      }
    }
  };
}

function initClient () {
  debug('Initializing client');
  if (!this.client) {
    throw new Error('initClient() must be bound to an Api instance and have a client property.');
  }
  if (!this.sources) {
    throw new Error('initClient() must be bound to an Api instance and have a sources property.');
  }
  const sources = this.sources;
  for (const dataType in sources) {
    this.client.registerMethod(dataType, sources[dataType].link, 'GET');
    debug('Registered client method', dataType, sources[dataType].link);
  }

  const patchSourceUrl = linkAPI(this.protocol, 'static-data/${region}/v1.2/versions');
  this.client.registerMethod('patch', patchSourceUrl, 'GET');
  debug('Registered client method', 'patch', patchSourceUrl);

  // Promisify the node client methods and add the hooks
  debug('Promisifying the client');
  for (const method in this.client.methods) {
    const oldMethod = this.client.methods[method];
    this.client.methods[method + 'Async'] = (...args) => new Promise((resolve, reject) => {
      // API source
      const source = args[0].source;
      if (source && source.beforeRequest) {
        try {
          // Only pass the client args
          source.beforeRequest.call(args[0]);
        } catch (e) {
          reject(e);
        }
      }

      oldMethod(...args, (data, response) => {
        let hookData = { args: args[0], data: data };
        if (source && source.afterRequest) {
          try {
            source.afterRequest.call(hookData);
          } catch (e) {
            reject(e);
          }
        }

        resolve({ data: hookData.data, response: response });
      });
    });
  }
  debug('Promisifyed the client');
  debug('Initialized client');
}

class Api {
  constructor (apiKey, region, { protocol, locale, cache }) {
    if (protocol && protocol !== 'http' && protocol !== 'https') {
      throw new Error(`forbidden protocol : ${protocol}`);
    }

    debug('Initializing API');

    this.apiKey = apiKey;
    this.region = region;
    this.protocol = protocol || 'https';
    this.locale = locale || 'en_US';
    this.sources = createApiSources.call(this);

    this.client = new Client();
    this.client.on('error', err => {
      console.error('Something went wrong on the client', err);
    });

    const cacheOpts = {
      stdTTL: (cache || {}).stdTTL || 60*60*12,
      checkperiod: (cache || {}).checkperiod || 60*60*12
    };
    this.cache = new Cache(cacheOpts);

    initClient.call(this);

    debug('Initialized API');
  }

  getSources () {
    debug('Api.getSources() call');
    return _.keys(this.sources);
  }

  async getPatchVersion () {
    debug('Api.getPatchVersion() call');
    let patchVersion = null;
    if (!this.cache.get('api.patchVersion')) {
      debug('No cache, requesting patch version');
      const clientArgs = {
        path: { 'region': this.region },
        parameters: { 'api_key': this.apiKey }
      };
      let result;
      try {
        result = await this.client.methods['patchAsync'](clientArgs);
      } catch (e) {
        throw new Error(e);
      }
      debug('Patch response', result.response.statusCode, result.response.statusMessage);
      if (!result.response.statusCode.toString().startsWith('2')) {
        // Not 2xx http code
        throw new Error(`${result.response.statusCode} : ${result.response.statusMessage}`);
      }
      patchVersion = _(result.data).head();
      this.cache.set('api.patchVersion', patchVersion);
    } else {
      debug('Getting patch version from cache');
      patchVersion = this.cache.get('api.patchVersion');
    }
    debug('Patch version', patchVersion);
    return patchVersion;
  }

  async getData (dataType, id) {
    debug('Api.getData() call', dataType, id);
    if (!this.sources.hasOwnProperty(dataType)) {
      throw new Error(`unknown data type : ${dataType}`);
    }
    let data = null;
    const key = `api.data_${dataType}-${id}`;
    if (!this.cache.get(key)) {
      debug('No cache, requesting data', dataType, id);
      const paramsGET = { 'api_key': this.apiKey, 'locale': this.locale };
      const routeArgs = this.sources[dataType].args;
      const clientArgs = {
        path: { 'region': this.region, 'id': id },
        parameters: _.merge(paramsGET, routeArgs),
        source: this.sources[dataType]
      };
      let result;
      try {
        result = await this.client.methods[dataType + 'Async'](clientArgs);
      } catch (e) {
        throw new Error(e);
      }
      debug('Data response', result.response.statusCode, result.response.statusMessage);
      if (!result.response.statusCode.toString().startsWith('2')) {
        // Not 2xx http code
        throw new Error(`${result.response.statusCode} : ${result.response.statusMessage}`);
      }
      data = {
        dataType: dataType,
        id: id,
        data: result.data
      };
      this.cache.set(key, data);
    } else {
      debug('Getting data from cache');
      data = this.cache.get(key);
    }
    return data;
  }
}

export { Api };
