var path = require('path');
var webpack = require('webpack');

module.exports = {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: {
      contentBase: path.join(__dirname, '..', 'dist'),
     hot: true,
    },
    entry: 
        ['babel-polyfill', 'react-hot-loader/patch', path.join(__dirname, '..', 'src', 'client', 'index.js')],
    output: {
        path: path.join(__dirname, '..', 'dist'),
        filename: 'bundle.js',
        publicPath: '/'
    },
    plugins: [
	new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development')
            }
        })
    ],
    module: {
        rules: [
            {
                test: /\.js$/,
		loader: 'babel-loader',
query: {
          presets: ["es2015", "stage-0", "react"],
          plugins: ["react-hot-loader/babel"],
},
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader',
            },
            {
                test: /\.png$/,
                loader: 'url-loader?limit=100000',
            },
            {
                test: /\.jpg$/,
                loader: 'file-loader',
            },
            {
                test: /\.(woff|woff2)(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url?limit=10000&mimetype=application/font-woff',
            },
            {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url?limit=10000&mimetype=application/octet-stream',
            },
            {
                test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'file',
            },
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                loader: 'url?limit=10000&mimetype=image/svg+xml',
            },
        ]
    }
};
