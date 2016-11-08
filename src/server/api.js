import path from 'path';
import Debug from 'debug';
import _ from 'lodash';
import { Client } from 'node-rest-client';
import Cache from 'node-cache';

const RIOT_API = 'global.api.pvp.net/api/lol/';

const debug = Debug('league-tooltips:api');

function linkAPI(protocol, route) {
  const linkDomain = path.join(RIOT_API, route);
  const url = `${protocol}://${linkDomain}`;
  debug('Linking API', url);
  return url;
}

function createApiSources() {
  if (!this.protocol) {
    throw new Error('createApiSources() must be bound to an Api instance.');
  }
  return {
    item: {
      // eslint-disable-next-line no-template-curly-in-string
      link: linkAPI(this.protocol, 'static-data/${region}/v1.2/item/${id}'),
      args: {
        itemData: ['tags', 'image', 'gold'].join(','),
      },
    },
    champion: {
      // eslint-disable-next-line no-template-curly-in-string
      link: linkAPI(this.protocol, 'static-data/${region}/v1.2/champion/${id}'),
      args: {
        champData: ['tags', 'stats', 'image', 'passive', 'spells', 'info'].join(','),
      },
    },
    summonerspell: {
      // eslint-disable-next-line no-template-curly-in-string
      link: linkAPI(this.protocol, 'static-data/${region}/v1.2/summoner-spell/${id}'),
      args: {
        spellData: ['image', 'rangeBurn', 'cooldownBurn', 'modes'].join(','),
      },
    },
    rune: {
      // eslint-disable-next-line no-template-curly-in-string
      link: linkAPI(this.protocol, 'static-data/${region}/v1.2/rune/${id}'),
      args: {
        runeData: ['tags', 'image'].join(','),
      },
    },
    mastery: {
      // eslint-disable-next-line no-template-curly-in-string
      link: linkAPI(this.protocol, 'static-data/${region}/v1.2/mastery/${id}'),
      args: {
        masteryData: ['ranks', 'image', 'masteryTree'].join(','),
      },
    },
    championspell: {
      beforeRequest() {
        // 'this' is bound to 'clientArgs'
        this.beforeId = this.path.id;
        this.path.id = this.path.id.split('.')[0];
        debug('championspell.beforeRequest().beforeId', this.beforeId);
        debug('championspell.beforeRequest().path.id', this.path.id);
      },
      afterRequest() {
        // 'this' is bound to the data retrieved and the 'clientArgs'
        const spells = ['Q', 'W', 'E', 'R'];
        const key = _.last(this.args.beforeId.split('.'));
        const index = _.indexOf(spells, key);
        if (index === -1) {
          throw new Error('Invalid spell key');
        }
        const data = this.data.spells[index];
        debug('championspell.afterRequest().index', index);
        debug('championspell.afterRequest().key', key);
        return data;
      },
      // eslint-disable-next-line no-template-curly-in-string
      link: linkAPI(this.protocol, 'static-data/${region}/v1.2/champion/${id}'),
      args: {
        champData: ['tags', 'stats', 'image', 'passive', 'spells', 'info'].join(','),
      },
    },
  };
}

function initClient() {
  debug('Initializing client');
  if (!this.client) {
    throw new Error('initClient() must be bound to an Api instance and have a client property.');
  }
  if (!this.sources) {
    throw new Error('initClient() must be bound to an Api instance and have a sources property.');
  }
  const sources = this.sources;
  _.keys(sources).forEeach((dataType) => {
    this.client.registerMethod(dataType, sources[dataType].link, 'GET');
    debug('Registered client method', dataType, sources[dataType].link);
  });

  // eslint-disable-next-line no-template-curly-in-string
  const patchSourceUrl = linkAPI(this.protocol, 'static-data/${region}/v1.2/versions');
  this.client.registerMethod('patch', patchSourceUrl, 'GET');
  debug('Registered client method', 'patch', patchSourceUrl);

  // eslint-disable-next-line no-template-curly-in-string
  const localesSourceUrl = linkAPI(this.protocol, 'static-data/${region}/v1.2/language-strings');
  this.client.registerMethod('locale', localesSourceUrl, 'GET');
  debug('Registered client method', 'locale', localesSourceUrl);

  // Promisify the node client methods and add the hooks
  debug('Promisifying the client');
  _.keys(this.client.methods).forEach((method) => {
    const oldMethod = this.client.methods[method];
    this.client.methods[`${method}Async`] = (...args) => new Promise((resolve, reject) => {
      // beforeRequest changes the client params
      // afterRequest returns the datas and changes nothing

      const source = args[0].source; // API source
      if (source && source.beforeRequest) {
        try {
          // Only pass the client args
          source.beforeRequest.call(args[0]);
        } catch (e) {
          reject(e);
        }
      }

      oldMethod(...args, (data, response) => {
        const hookData = { args: args[0], data };
        let dataResult = data;
        if (source && source.afterRequest) {
          try {
            dataResult = source.afterRequest.call(hookData);
          } catch (e) {
            reject(e);
          }
        }

        resolve({ data: dataResult, response });
      });
    });
  });
  debug('Promisifyed the client');
  debug('Initialized client');
}

class Api {
  constructor(apiKey, region, { protocol, cache }) {
    if (protocol && protocol !== 'http' && protocol !== 'https') {
      throw new Error(`forbidden protocol : ${protocol}`);
    }

    debug('Initializing API');

    this.apiKey = apiKey;
    this.region = region;
    this.protocol = protocol || 'https';
    this.sources = createApiSources.call(this);

    this.client = new Client();
    this.client.on('error', (err) => {
      debug('Error on the REST client', err);
    });

    const cacheOpts = {
      stdTTL: (cache || {}).stdTTL || 60 * 60 * 12,
      checkperiod: (cache || {}).checkperiod || 60 * 60 * 12,
    };
    this.cache = new Cache(cacheOpts);

    initClient.call(this);

    debug('Initialized API');
  }

  getSources() {
    debug('Api.getSources() call');
    return _.keys(this.sources);
  }

  async getPatchVersion() {
    debug('Api.getPatchVersion() call');
    let patchVersion = null;
    if (!this.cache.get('api.patchVersion')) {
      debug('No cache, requesting patch version');
      const clientArgs = {
        path: { region: this.region },
        parameters: { api_key: this.apiKey },
      };
      let result;
      try {
        result = await this.client.methods.patchAsync(clientArgs);
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

  async getLocale(locale) {
    debug('Api.getLocales() call');
    const localeKey = `api.locale_${locale}`;
    let localeData = null;
    if (!this.cache.get(localeKey)) {
      debug('No cache, requesting locale', locale);
      const clientArgs = {
        path: { region: this.region },
        parameters: { api_key: this.apiKey },
      };
      let result;
      try {
        result = await this.client.methods.localeAsync(clientArgs);
      } catch (e) {
        throw new Error(e);
      }
      debug('Locale response', result.response.statusCode, result.response.statusMessage);
      if (!result.response.statusCode.toString().startsWith('2')) {
        // Not 2xx http code
        throw new Error(`${result.response.statusCode} : ${result.response.statusMessage}`);
      }
      localeData = result.data;
      this.cache.set(localeKey, localeData);
    } else {
      debug('Getting locale from cache', locale);
      localeData = this.cache.get(localeKey);
    }
    return localeData;
  }

  async getData(dataType, id, locale = 'en_US') {
    debug('Api.getData() call', dataType, id, locale);
    if (!{}.hasOwnProperty.call(this.sources, dataType)) {
      throw new Error(`unknown data type : ${dataType}`);
    }
    let data = null;
    const key = `api.data_${dataType}-${id}_${locale}`;
    if (!this.cache.get(key)) {
      debug('No cache, requesting data', dataType, id, locale);
      const paramsGET = { api_key: this.apiKey, locale };
      const routeArgs = this.sources[dataType].args;
      const clientArgs = {
        path: { region: this.region, id },
        parameters: _.merge(paramsGET, routeArgs),
        source: this.sources[dataType],
      };
      let result;
      try {
        result = await this.client.methods[`${dataType}Async`](clientArgs);
      } catch (e) {
        throw new Error(e);
      }
      debug('Data response', result.response.statusCode, result.response.statusMessage);
      if (!result.response.statusCode.toString().startsWith('2')) {
        // Not 2xx http code
        throw new Error(`${result.response.statusCode} : ${result.response.statusMessage}`);
      }
      data = {
        dataType,
        id,
        data: result.data,
      };
      this.cache.set(key, data);
    } else {
      debug('Getting data from cache');
      data = this.cache.get(key);
    }
    return data;
  }
}

export default Api;
