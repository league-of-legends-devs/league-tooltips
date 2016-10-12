import path from 'path';
import _ from 'lodash';
import { Client } from 'node-rest-client';

const RIOT_API = 'global.api.pvp.net/api/lol/';

function linkAPI (protocol, route) {
  return protocol + '://' + path.join(RIOT_API, route);
};

const client = new Client();
client.on('error', err => {
  console.error('Something went wrong on the client', err);
});

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
    }
  };
}

function initClient () {
  if (!this.sources) {
    throw new Error('initClient() must be bound to an Api instance.');
  }
  const sources = this.sources;
  for (const dataType in sources) {
    client.registerMethod(dataType, sources[dataType].link, 'GET');
  }

  client.registerMethod('patch', linkAPI(this.protocol, 'static-data/${region}/v1.2/versions'), 'GET');

  // Promisify the node client methods
  for (const method in client.methods) {
    client.methods[method + 'Async'] = (...args) => new Promise((resolve, reject) => {
      try {
        client.methods[method](...args, (data, response) => {
          resolve({ data: data, response: response });
        });
      } catch (e) {
        reject(e);
      }
    });
  }
}


class Api {
  constructor (apiKey, region, { protocol, locale }) {
    if (protocol && protocol !== 'http' && protocol !== 'https') {
      throw new Error(`forbidden protocol : ${protocol}`);
    }

    this.apiKey = apiKey;
    this.region = region;
    this.protocol = protocol || 'https';
    this.locale = locale || 'en_US';
    this.sources = createApiSources.call(this);

    initClient.call(this);
  }

  getSources () {
    return _.keys(this.sources);
  }

  async getPatchVersion () {
    const clientArgs = {
      path: { 'region': this.region },
      parameters: { 'api_key': this.apiKey }
    };
    let result;
    try {
      result = await client.methods['patchAsync'](clientArgs);
    } catch (err) {
      throw new Error(e);
    }
    if (!result.response.statusCode.toString().startsWith('2')) {
      // Not 2xx http code
      throw new Error(`${result.response.statusCode} : ${result.response.statusMessage}`);
    }
    return _(result.data).head();
  }

  async getData (dataType, id) {
    if (!this.sources.hasOwnProperty(dataType))
      throw new Error(`unknown data type : ${dataType}`);

    const paramsGET = { 'api_key': this.apiKey, 'locale': this.locale };
    const routeArgs = this.sources[dataType].args;
    const clientArgs = {
      path: { 'region': this.region, 'id': id },
      parameters: _.merge(paramsGET, routeArgs)
    };

    let result;
    try {
      result = await client.methods[dataType + 'Async'](clientArgs);
    } catch (err) {
      throw new Error(e);
    }
    if (!result.response.statusCode.toString().startsWith('2')) {
      // Not 2xx http code
      throw new Error(`${result.response.statusCode} : ${result.response.statusMessage}`);
    }

    return {
      dataType: dataType,
      id: id,
      data: result.data
    };
  }
}

export { Api };
