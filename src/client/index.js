import 'babel-polyfill';
import 'whatwg-fetch';
import _ from 'lodash';
import LeagueTooltipsDebug from 'debug';

(() => {

  const debug = LeagueTooltipsDebug('league-tooltips');
  window.leagueTooltipsDebug = LeagueTooltipsDebug;

  // $BASE_ROUTE won't be minified by Webpack and will be replaced on-the-fly with the base route set in the middleware configuration
  const BASE_ROUTE_FROM_CONFIG = $BASE_ROUTE || null;
  debug('Base route from config', BASE_ROUTE_FROM_CONFIG);
  if (!BASE_ROUTE_FROM_CONFIG) {
    console.warn('[league-tooltips] $BASE_ROUTE is not set');
  }
  const BASE_ROUTE = (BASE_ROUTE_FROM_CONFIG + '/') || '/tooltips/';
  debug('Base route', BASE_ROUTE);

  const ALLOWED_DATAS = ['champion', 'item', 'summonerspell', 'rune', 'mastery', 'championspell'];

  // Use http://youmightnotneedjquery.com/#ready ?
  window.onload = () => {
    initTips();
  };

  let datasCache = {};

  const tooltip = {
    id: 'league-tooltip',
    offsetx: 10,
    offsety: 10,
    _x: 0,
    _y: 0,
    _tooltipElement: null,
    _saveonmouseover: null
  };

  tooltip.show = function (e) {
    const htmlelement = e.target;

    if (document.getElementById) {
      this._tooltipElement = document.getElementById(this.id);
    } else if (document.all) {
      this._tooltipElement = document.all[this.id].style;
    }

    const loadingGifLink = BASE_ROUTE + 'assets/img/load.gif';
    this._tooltipElement.innerHTML = _.template(datasCache['loadingHtml'])({ gifLink: loadingGifLink });

    this._saveonmouseover = document.onmousemove;
    document.onmousemove = this.mouseMove;

    this.moveTo(this._x + this.offsetx, this._y + this.offsety);

    if (this._tooltipElement.style) {
      this._tooltipElement.style.visibility = 'visible';
    } else {
      this._tooltipElement.visibility = 'visible';
    }

    this.render(htmlelement.dataset);

    return false;
  };
  tooltip.hide = function (e) {
    if (this._tooltipElement.style) {
      this._tooltipElement.style.visibility = 'hidden';
    } else {
      this._tooltipElement.visibility = 'hidden';
    }
    document.onmousemove = this._saveonmouseover;
    this._tooltipElement.innerHTML = '';
  };

  tooltip.mouseMove = function (e) {
    if (e == undefined) {
      e = event;
    }
    if (e.pageX != undefined) { // gecko, konqueror,
      tooltip._x = e.pageX;
      tooltip._y = e.pageY;
    } else if (event != undefined && event.x != undefined && event.clientX == undefined) { // ie4
      tooltip._x = event.x;
      tooltip._y = event.y;
    } else if (e.clientX != undefined ) { // IE6,  IE7, IE5.5
      if (document.documentElement) {
        tooltip._x = e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft);
        tooltip._y = e.clientY + (document.documentElement.scrollTop || document.body.scrollTop);
      } else {
        tooltip._x = e.clientX + document.body.scrollLeft;
        tooltip._y = e.clientY + document.body.scrollTop;
      }
    } else {
      tooltip._x = 0;
      tooltip._y = 0;
    }
    tooltip.moveTo(tooltip._x + tooltip.offsetx, tooltip._y + tooltip.offsety);
  };

  tooltip.moveTo = function (xL, yL) {
    if (this._tooltipElement.style) {
      this._tooltipElement.style.left = xL + 'px';
      this._tooltipElement.style.top = yL + 'px';
    } else {
      this._tooltipElement.left = xL;
      this._tooltipElement.top = yL;
    }
  };

  tooltip.render = async function (dataset) {
    let dataType = null;
    let dataParam = null;
    for (let allowedData of ALLOWED_DATAS) {
      if (dataset[allowedData]) {
        dataType = allowedData;
        dataParam = dataset[allowedData];
      }
    }

    if (!dataType) {
      debug('Ignoring invalid data type');
      return;
    }

    // If the patch is empty or errored, retry
    if (!datasCache['patch'] || datasCache['patch'].err) {
      debug('Patch empty or errored : requesting patch version');
      loadPatchVersion();
    }
    if (!datasCache['patch']) {
      debug('Patch still empty : display error');
      this._tooltipElement.innerHTML = _.template(datasCache['errorHtml'])({ error: 'Error : no patch version available.' });
      return;
    }
    if (datasCache['patch'].err) {
      debug('Patch errored : display error');
      const patchErr = datasCache['patch'].err;
      this._tooltipElement.innerHTML = _.template(datasCache['errorHtml'])({ error: patchErr });
      return;
    }

    let templateHtml = null;
    if (!datasCache.hasOwnProperty(dataType) || !datasCache[dataType].hasOwnProperty(dataParam) || !datasCache[dataType][dataParam].template) {
      debug(`Requesting ${dataType} template`);
      const tooltipQuery = await fetch(BASE_ROUTE + `html/${dataType}.html`);
      const tooltipHtml = await tooltipQuery.text();
      templateHtml = tooltipHtml;
      debug(`Requested ${dataType} template`);
    } else {
      debug(`Loading ${dataType} template from cache`);
      templateHtml = datasCache[dataType][dataParam].template;
    }
    const template = _.template(templateHtml);

    let jsonData;
    if (!datasCache.hasOwnProperty(dataType) || !datasCache[dataType].hasOwnProperty(dataParam) || !datasCache[dataType][dataParam].data) {
      debug(`Requesting ${dataType}/${dataParam} datas`, datasCache['patch']);
      const queryUrl = BASE_ROUTE + dataType + '/' + dataParam;
      try {
        const response = await fetch(queryUrl);
        jsonData = await response.json();
      } catch (e) {
        console.error(e);
      }
      jsonData = _.merge(jsonData, { patchVersion: datasCache['patch'] });
      debug(`Requested ${dataType}/${dataParam} datas`, datasCache['patch']);
    } else {
      debug(`Loading ${dataType} datas from cache`);
      jsonData = datasCache[dataType][dataParam].data;
    }

    if (jsonData.err) {
      debug('Error from server : displaying error', jsonData.err);
      this._tooltipElement.innerHTML = _.template(datasCache['errorHtml'])({ error: jsonData.err });
      return;
    }

    try {
      debug('Rendering datas in template');
      this._tooltipElement.innerHTML = template(jsonData);
      debug('Rendered datas in template');
    } catch (e) {
      debug('Fail to render datas in template : displaying error');
      this._tooltipElement.innerHTML = _.template(datasCache['errorHtml'])({ error: 'Display error' });
      console.error(e);
    }

    debug('Saving datas in cache');
    if (!datasCache[dataType]) {
      datasCache[dataType] = {};
    }
    datasCache[dataType][dataParam] = {
      data: jsonData,
      template: templateHtml
    };
  };

  async function loadPatchVersion () {
    debug('Requesting patch version');
    try {
      const patchResponse = await fetch(BASE_ROUTE + 'patch');
      datasCache['patch'] = await patchResponse.json();
      const err = datasCache['patch'].err;
      if (!patchResponse.status.toString().startsWith('2') || err) {
        console.error(`Error when retrieving the patch. Code ${patchResponse.status} : ${patchResponse.statusText}, message : "${err}".`);
      }
    } catch (e) {
      console.error(e);
      return;
    }
    debug('Requested patch version', datasCache['patch']);
  }

  async function initTips () {
    debug('Initializing league-tooltips');

    loadPatchVersion();

    debug('Requesting "loading" and "error" views');
    try {
      const loadingHtmlResponse = await fetch(BASE_ROUTE + 'html/loading.html');
      datasCache['loadingHtml'] = await loadingHtmlResponse.text();
    } catch (e) {
      console.error(e);
      return;
    }
    try {
      const errorHtmlResponse = await fetch(BASE_ROUTE + 'html/error.html');
      datasCache['errorHtml'] = await errorHtmlResponse.text();
    } catch (e) {
      console.error(e);
      return;
    }
    debug('Requested "loading" and "error" views');

    debug('Creating tooltip element');
    let tooltipElementDiv = document.createElement('div');
    tooltipElementDiv.id = 'league-tooltip';
    if (tooltipElementDiv.style) {
      tooltipElementDiv.style.visibility = 'hidden';
    } else {
      tooltipElementDiv.visibility = 'hidden';
    }
    document.body.insertBefore(tooltipElementDiv, document.body.childNodes[0]);
    debug('Created tooltip element');

    debug('Appending league-tooltips stylesheets');
    const cssLink = document.createElement('link');
    cssLink.href = BASE_ROUTE + `styles/tooltip.css`;
    cssLink.type = 'text/css';
    cssLink.rel = 'stylesheet';
    cssLink.media = 'screen,print';
    document.getElementsByTagName('head')[0].appendChild(cssLink);
    debug('Appended league-tooltips stylesheets');

    debug('Adding listeners to .league-tooltip elements');
    const tooltips = document.getElementsByClassName('league-tooltip');
    for (let index = 0; index < tooltips.length; index++) {
      const tooltipElement = tooltips.item(index);
      tooltipElement.addEventListener('mouseover', tooltip.show.bind(tooltip));
      tooltipElement.addEventListener('mouseout', tooltip.hide.bind(tooltip));
    }
    debug('Added listeners');

    debug('Initialized league-tooltips');
  }
})();
