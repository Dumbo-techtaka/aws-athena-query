//@ts-check

'use strict';

const path = require('path');

/**@type {import('webpack').Configuration}*/
const extensionConfig = {
  target: 'node', // vscode extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
  mode: 'none', // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

  entry: './src/extension.ts', // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, 'dist'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2'
  },
  externals: {
    vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: ['.ts', '.js', '.tsx', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  devtool: 'nosources-source-map',
  infrastructureLogging: {
    level: "log", // enables logging required for problem matchers
  },
};

/**@type {import('webpack').Configuration}*/
const webviewConfig = {
  target: 'web',
  mode: 'none',
  entry: './src/webview/index.tsx',
  plugins: [
    new (require('webpack')).DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.platform': JSON.stringify('browser'),
      'process.version': JSON.stringify(''),
    }),
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'webview.js',
    libraryTarget: 'window'
  },
  resolve: {
    extensions: ['.ts', '.js', '.tsx', '.jsx'],
    fallback: {
      "process": false,
      "buffer": false,
      "util": false,
      "path": false,
      "fs": false,
      "os": false,
      "crypto": false,
      "stream": false,
      "url": false,
      "querystring": false,
      "zlib": false,
      "http": false,
      "https": false,
      "assert": false,
      "constants": false,
      "events": false,
      "punycode": false,
      "string_decoder": false,
      "tty": false,
      "vm": false,
      "domain": false,
      "module": false,
      "net": false,
      "child_process": false,
      "cluster": false,
      "dgram": false,
      "dns": false,
      "readline": false,
      "repl": false,
      "tls": false,
      "v8": false,
      "worker_threads": false
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'tsconfig.json')
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  devtool: 'nosources-source-map'
};

module.exports = [extensionConfig, webviewConfig];
