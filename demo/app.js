var express = require('express');
var leagueTips = require('../');
var config = require('./config.js');

var app = express();

app.use(express.static('public'));
app.use(leagueTips(config.key.riot, 'euw', { url: '/tooltips' }));

app.listen(config.port);
