# league-tooltips ([NPM link](https://www.npmjs.com/package/league-tooltips))

Express middleware for League of Legends tooltips : champions, items, summoner spells, runes, masteries and champion spells.

[![npm](https://img.shields.io/npm/dt/league-tooltips.svg)]() [![Known Vulnerabilities](https://snyk.io/test/npm/league-tooltips/badge.svg)](https://snyk.io/test/npm/league-tooltips)

![Champion tooltip](previews/champion.png)

[more screenshots here](PREVIEWS.md)

## Installation

`npm install --save league-tooltips`

## Demo : [here](https://tooltips.lol-item-sets-generator.org/)

## How to use

### Server :
```javascript
var express = require('express');
var leagueTips = require('league-tooltips');

var app = express();

app.use(leagueTips('RIOT_API_KEY', 'euw'));

app.listen(3000);
```

### Client :
```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Test</title>
    <script src="/league-tips.min.js"></script>
  </head>
  <body>
    <main>
      <div class="league-tooltip" data-champion="103">
        <!-- This div will show the Ahri tooltip on hover (Ahri ID : 103) -->
      </div>
    </main>
  </body>
</html>
```

You must set the `league-tootip` class and one of these `data-*` attributes :

* `data-champion` : `<champion id>`

 e.g. : `data-champion="103"` (Ahri)

* `data-item` : `<item id>`

 e.g. : `data-item="3027"` (Rod of Ages)

* `data-summonerspell` : `<summonerspell id>`

 e.g. : `data-summonerspell="4"` (Flash)

* `data-rune` : `<rune id>`

 e.g. : `data-rune="5311"` (Greater Seal of Critical Chance)

* `data-mastery` : `<mastery id>`

 e.g. : `data-mastery="6111"` (Fury)

* `data-championspell` : `id.key` (`.` is a separator)

 e.g. : `data-championspell="103.Q"`


The value must be the ID (from the [Riot API](https://developer.riotgames.com/)) of the element you want to show. If an element has more than one tag in this list, the list order will define the priority and the first occurrence will be used.

## API

`leagueTips(apiKey, region, options)` is an [express](http://expressjs.com/) [middleware](http://expressjs.com/en/guide/using-middleware.html).

It will return a `function (req, res, next) {}`.

### `apiKey`

**required**

The Riot API key. You can get one [here](https://developer.riotgames.com/).

### `region`

**required**

The location of the servers to query.
Riot has multiple servers across the world at different locations.

Allowed values : `br`, `eune`, `euw`, `jp`, `kr`, `lan`, `las`, `na`, `oce`, `pbe`, `ru` and `tr`.

### `options`

**optional** (default value : `{}`)

#### - `url` (String)

**default value** : `/` (e.g. : `/static/tooltips`)

The route where the static files and the datas will be served.

#### - `fileName` (String)

**default value** : `league-tips.min.js`

The name of the Javasript file that will be served to the client.

*e.g.*

`leagueTips('<API_KEY>', '<REGION>', { url: '/tooltips', fileName: 'league-tips.min.js' })`

will serve the file at `/tootips/league-tips.min.js`.

#### - `locale` (String)

The language of the retrieved datas (e.g., `en_US`, `es_ES`, `fr_FR` ...).

#### - `protocol` (String)

The HTTP protocol to use when querying the Riot API.

Allowed values : `http` and `https`.

#### - `cors` (Object)

* `origin` (String), defaults to `'*'` if `cors` is defined
* `methods` (String), defaults to `'GET,PUT,POST,DELETE'` if `cors` is defined
* `headers` (String), defaults to `'Content-Type'` if `cors` is defined

## Debug

This module uses the [debug module](https://www.npmjs.com/package/debug).
In order to show the debug logs, you must enable the debugging logs.

* **Server :** you must set the `league-tooltips:*` value in the `DEBUG` environment variable :
 * Linux : `export DEBUG=league-tooltips:*`
 * Windows : `set DEBUG=league-tooltips:*`
* **Browser :** type the following in the console : `leagueTooltipsDebug.enable('*')`


## How does it work ?

The express middleware will retrieve the required datas from the Riot API and store them. It will also serve a javascript file that must be executed by the client.

e.g.

```javascript
app.use(leagueTips('RIOT_API_KEY', 'euw', { url: '/tooltips', fileName: 'league-tips.min.js' }));
```
will serve the javascript file with the `/tooltips/league-tips.min.js` route.

The JS file will listen to the `onmouseover` events of all elements that have the `league-tooltip` class and show a tooltip when it triggers.
Every mouse hover will launch a query to the `/tooltips/` api route (if not stored in the browser cache) and retrieve the datas to show in the tooltip.

## TODO

### Release :
- [ ] Move the tooltip bottom left corner to the mouse cursor when the mouse is near the viewport bottom (instead of top left corner)
- [ ] Cache the retrieved Riot datas on server side
- [ ] Champion passives
- [ ] Allow to choose between setting the data id or the data key in `data-*`
- [ ] Add the mouseover listener to the newly created tooltips in the DOM
- [ ] Make the API return the proper HTTP error code (usually always 200)

### Ideas :
- [ ] Serve the templates in `league-tooltips.min.js` as lodash template in order to prevent direct templates requests to the server
- [ ] Use Webpack and CSS modulees
- [ ] Champion.GG integration ?
- [ ] Maybe serve the rendered tooltip.html file with express ? => { renderServerSide : true } ?
- [ ] Custom tooltip.html in middleware config
- [ ] Start the queries before the mouseover event triggers and cache the results

## License

MIT License

Copyright (c) 2016 Ilshidur

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
