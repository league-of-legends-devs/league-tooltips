# league-tooltips (IN ALPHA DEV PHASE)

[![stability](https://img.shields.io/badge/stability-experimental-orange.svg?style=flat-square)](https://nodejs.org/api/documentation.html#documentation_stability_index)

Express middleware for League of Legends tooltips : champions, items, summoner spells, runes and masteries.

![Champion tooltip](previews/champion.png)

[more screenshots here](PREVIEWS.md)

## Installation

`npm install --save league-tooltips`

## Demo

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

You must set the `league-tootip` class and one of these attributes :

* `data-champion`
* `data-item`
* `data-spell` (summoner spell)
* `data-rune`
* `data-mastery`

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

#### - `url`

**default value** : `/` (e.g. : `domain.com/static/tooltips`)

The route where the static files and the datas will be served.

#### - `fileName`

**default value** : `league-tips.min.js`

The name of the Javasript file that will be served to the client.

*e.g.*

`leagueTips('<API_KEY>', '<REGION>', '/tooltips', { fileName: 'league-tips.min.js' })`

will serve the file at `/tootips/league-tips.min.js`.

#### - `locale`

The language of the retrieved datas (e.g., `en_US`, `es_ES`, `fr_FR` ...).

#### - `protocol`

The HTTP protocol to use when querying the Riot API.

Allowed values : `http` and `https`.

## How does it work ?

The express middleware will retrieve the required datas from the Riot API and store them. It will also serve a javascript file that must be executed by the client.

e.g.

```javascript
app.use(leagueTips('RIOT_API_KEY', 'euw', 'league-tooltips.com/tooltips', { fileName: 'league-tips.min.js' }));
```
will serve the javascript file with the `league-tooltips.com/tooltips/league-tips.min.js` route.

The JS file will now create a LeagueTooltip object that will listen to the `onmouseover` events of all elements that have the `league-tooltip` class.
Every mouse hover will launch a query to the `domain.com/tooltips/api` route (if not stored in the browser cache) and retrieve the datas to show in the tooltip.

## TODO

### Beta :
- [ ] Loading gif
- [ ] Refractor

### Release :
- [ ] Add the champion spells
- [ ] Add the mouseover listener to the newly created tooltips in the DOM

### Ideas :
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
