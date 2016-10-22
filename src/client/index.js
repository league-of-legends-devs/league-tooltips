import 'babel-polyfill';
import 'whatwg-fetch';
import _ from 'lodash';
import LeagueTooltipsDebug from 'debug';

(() => {

  const debug = LeagueTooltipsDebug('league-tooltips');
  window.leagueTooltips = {
    debug: LeagueTooltipsDebug,
    locale: 'en_US'
  };

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

    if (tooltip._x + tooltip._tooltipElement.clientWidth < window.innerWidth && tooltip._y + tooltip._tooltipElement.clientHeight < window.innerHeight) {
      tooltip.moveTo(tooltip._x + tooltip.offsetx, tooltip._y + tooltip.offsety);
    } else if (tooltip._x + tooltip._tooltipElement.clientWidth >= window.innerWidth && tooltip._y + tooltip._tooltipElement.clientHeight < window.innerHeight) {
      tooltip.moveTo(tooltip._x - tooltip._tooltipElement.clientWidth - tooltip.offsetx, tooltip._y + tooltip.offsety);
    } else if (tooltip._x + tooltip._tooltipElement.clientWidth < window.innerWidth && tooltip._y + tooltip._tooltipElement.clientHeight >= window.innerHeight) {
      tooltip.moveTo(tooltip._x + tooltip.offsetx, tooltip._y - tooltip._tooltipElement.clientHeight - tooltip.offsety);
    } else {
      tooltip.moveTo(tooltip._x - tooltip._tooltipElement.clientWidth - tooltip.offsetx, tooltip._y - tooltip._tooltipElement.clientHeight - tooltip.offsety);
    }

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

    const locale = window.leagueTooltips.locale;
    const key = `${dataParam}_${locale}`;

    let templateHtml = null;
    if (!datasCache.hasOwnProperty(dataType) || !datasCache[dataType].hasOwnProperty(key) || !datasCache[dataType][key].template) {
      debug(`Requesting ${dataType} template`);
      try {
        const tooltipQuery = await fetch(BASE_ROUTE + `html/${dataType}.html`);
        const tooltipHtml = await tooltipQuery.text();
        templateHtml = tooltipHtml;
      } catch (e) {
        debug(`Fail to request ${dataType} template : displaying error`);
        this._tooltipElement.innerHTML = _.template(datasCache['errorHtml'])({ error: `Can't request ${dataType}.html` });
      }
      debug(`Requested ${dataType} template`);
    } else {
      debug(`Loading ${dataType} template from cache`);
      templateHtml = datasCache[dataType][key].template;
    }

    if (!templateHtml) {
      return;
    }

    const tooltipTemplate = _.template(templateHtml);

    let jsonData;
    if (!datasCache.hasOwnProperty(dataType) || !datasCache[dataType].hasOwnProperty(key) || !datasCache[dataType][key].data) {
      debug(`Requesting ${dataType}/${dataParam} datas`, datasCache['patch']);
      const locale = window.leagueTooltips.locale;
      const queryUrl = BASE_ROUTE + dataType + '/' + dataParam + '?locale=' + locale;
      try {
        const response = await fetch(queryUrl);
        jsonData = await response.json();
      } catch (e) {
        debug(`Fail to request ${dataType}/${dataParam} datas : displaying error`);
        this._tooltipElement.innerHTML = _.template(datasCache['errorHtml'])({ error: `Can't request ${dataType}/${dataParam}` });
      }
      if (jsonData) {
        jsonData = _.merge(jsonData, { patchVersion: datasCache['patch'] });
      }
      debug(`Requested ${dataType}/${dataParam} datas`, datasCache['patch']);
    } else {
      debug(`Loading ${dataType} datas from cache`);
      jsonData = datasCache[dataType][key].data;
    }

    if (!jsonData) {
      return;
    }

    if (jsonData.err) {
      debug('Error from server : displaying error', jsonData.err);
      this._tooltipElement.innerHTML = _.template(datasCache['errorHtml'])({ error: jsonData.err });
      return;
    }

    try {
      debug('Rendering datas in template');
      this._tooltipElement.innerHTML = tooltipTemplate(jsonData);
      debug('Rendered datas in template');
    } catch (e) {
      debug('Fail to render datas in template : displaying error');
      this._tooltipElement.innerHTML = _.template(datasCache['errorHtml'])({ error: 'Display error' });
    }

    debug('Saving datas in cache');
    if (!datasCache[dataType]) {
      datasCache[dataType] = {};
    }
    datasCache[dataType][key] = {
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
      return;
    }
    debug('Requested patch version', datasCache['patch']);
  }

  async function loadLocale () {
    debug('Requesting locale');
    const locale = window.leagueTooltips.locale;
    try {
      const localeResponse = await fetch(BASE_ROUTE + 'locale/' + locale);
      datasCache['locale'] = await localeResponse.json();
      const err = datasCache['locale'].err;
      if (!localeResponse.status.toString().startsWith('2') || err) {
        console.error(`Error when retrieving the locale. Code ${localeResponse.status} : ${localeResponse.statusText}, message : "${err}".`);
      }
    } catch (e) {
      return;
    }
    debug('Requested locale', locale);
  }

  async function loadLoadingTemplate () {
    debug('Requesting loading template');
    try {
      const loadingHtmlResponse = await fetch(BASE_ROUTE + 'html/loading.html');
      datasCache['loadingHtml'] = await loadingHtmlResponse.text();
    } catch (e) {
      datasCache['loadingHtml'] =
        `<div class="league-tooltip__info">
          <img src="<%= gifLink %>" alt="Loading ..." />
        </div>`;
      return;
    }
    debug('Requested loading template');
  }

  async function loadErrorTemplate () {
    debug('Requesting error template');
    try {
      const errorHtmlResponse = await fetch(BASE_ROUTE + 'html/error.html');
      datasCache['errorHtml'] = await errorHtmlResponse.text();
    } catch (e) {
      datasCache['errorHtml'] =
        `<div class="league-tooltip__info">
          <h1 class="league-tooltip__title"><%= error %></h1>
        </div>`;
      return;
    }
    debug('Requested error template');
  }

  async function initTips () {
    debug('Initializing league-tooltips');

    loadPatchVersion();
    loadLocale();
    loadLoadingTemplate();
    loadErrorTemplate();

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
