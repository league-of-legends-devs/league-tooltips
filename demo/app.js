const path = require('path');
const express = require('express');
const leagueTips = require('../');
const config = require('./config.js');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use('/tooltips', leagueTips(config.key.riot, leagueTips.REGIONS.EUROPE_WEST, {
  redis: {
    host: 'localhost',
    port: 6379,
    prefix: 'league-tooltips-demo_'
  }
}));

app.listen(config.port, () => {
  console.log('Listening to port', config.port);
});
