var webpack = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {

  entry: ['babel-polyfill', './src/client/index.js'],
  devtool: 'source-map',
  output: {
    // path: __dirname + '/lib/client',
    filename: 'league-tips.min.js'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015', 'stage-0']
        }
      }
    ]
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      minimize: true,
      mangle: { except: ['$BASE_ROUTE'] }
    }),
    new CopyWebpackPlugin([
      { from: './src/client/views', to: 'views' },
      { from: './src/client/styles', to: 'styles' }
    ])
  ]
};
