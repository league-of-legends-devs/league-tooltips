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
    },
    'championspell': {
      beforeRequest: function () {
        // 'this' is bound to 'clientArgs'
        this.beforeId = this.path.id;
        this.path.id = this.path.id.split('.')[0];
      },
      afterRequest: function () {
        // 'this' is bound to the data retrieved and the 'clientArgs'
        const spells = ['Q', 'W', 'E', 'R'];
        const index = _.indexOf(spells, _.last(this.args.beforeId.split('.')));
        if (index === -1) {
          throw new Error('Invalid spell key');
        }
        this.data = this.data.spells[index];
      },
      link: linkAPI(this.protocol, 'static-data/${region}/v1.2/champion/${id}'),
      args: {
        champData: ['tags', 'stats', 'image', 'passive', 'spells', 'info'].join(',')
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

  // Promisify the node client methods and add the hooks
  for (const method in client.methods) {
    const oldMethod = client.methods[method];
    client.methods[method + 'Async'] = (...args) => new Promise((resolve, reject) => {
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
    } catch (e) {
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
      parameters: _.merge(paramsGET, routeArgs),
      source: this.sources[dataType]
    };

    let result;
    try {
      result = await client.methods[dataType + 'Async'](clientArgs);
    } catch (e) {
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
