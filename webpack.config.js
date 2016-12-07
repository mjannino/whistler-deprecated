var path = require("path");
var webpack = require("webpack");

module.exports = {
    entry: {
        filename: './scripts/entry.js'
    },
    output: {
        filename: 'scripts/bundle.js'
    },
    node: {
      fs: "empty",
      net: 'empty',
      tls: 'empty',
      dns: 'empty'
    },
    stats: {warnings:false},
    module: {
        loaders: [
            { test: /\.json$/, loader: "json-loader" },
            {
              test: /\.js$/,
              exclude: /node_modules/,
              loader: 'babel',
              query: {
                presets: ['es2015']
              }
            }
        ]
    },
    exclude: /node_modules/
};
