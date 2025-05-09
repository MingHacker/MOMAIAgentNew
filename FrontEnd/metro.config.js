const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const extraNodeModules = {
  stream: require.resolve('./shim/empty.js'),
  ws: require.resolve('./shim/empty.js'),
  events: require.resolve('./shim/empty.js'),
  net: require.resolve('./shim/empty.js'),
  tls: require.resolve('./shim/empty.js'),
  http: require.resolve('./shim/empty.js'),
  https: require.resolve('./shim/empty.js'),
  zlib: require.resolve('./shim/empty.js'),
  crypto: require.resolve('./shim/empty.js'),
  path: require.resolve('./shim/empty.js'),
  fs: require.resolve('./shim/empty.js'),
  util: require.resolve('./shim/empty.js'),
  child_process: require.resolve('./shim/empty.js'),
  dgram: require.resolve('./shim/empty.js'),
  readline: require.resolve('./shim/empty.js'),
  os: require.resolve('./shim/empty.js'),
  assert: require.resolve('./shim/empty.js'),
  constants: require.resolve('./shim/empty.js'),
  module: require.resolve('./shim/empty.js'),
  timers: require.resolve('./shim/empty.js'),
  tty: require.resolve('./shim/empty.js'),
  vm: require.resolve('./shim/empty.js'),
  worker_threads: require.resolve('./shim/empty.js'),
  domain: require.resolve('./shim/empty.js'),
  buffer: require.resolve('./shim/empty.js'),
  url: require.resolve('./shim/empty.js'), // 新增这一行
};

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  ...extraNodeModules,
};

module.exports = config;