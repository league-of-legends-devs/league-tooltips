var path = require('path');
var express = require('express');
var leagueTips = require('../');
var config = require('./config.js');

var app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use('/tooltips', leagueTips(config.key.riot, 'euw'));

app.listen(config.port);
