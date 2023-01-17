const MODE = process.env.MODE || 'development';

let options = {
  sourceMap: MODE === 'development',
  devtool: MODE === 'development' ? 'source-map' : 'hidden-nosources-cheap-source-map',
};

module.exports = {
  mode: MODE,
  devtool: options.devtool,
  output: {
    filename: '[name].min.js',
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
};