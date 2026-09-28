const path = require('path');
const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');

module.exports = merge(common, {
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      },
    ],
  },
  
  stats: 'errors-warnings',
  
  devServer: {
    static: path.resolve(__dirname, 'public'),
    port: 9000,
    historyApiFallback: true,
    proxy: [
      { context: ['/api', '/auth', '/ml', '/public'], target: 'http://localhost:5000' },
    ],
    client: {
      logging: 'warn',
    },
  },
});
