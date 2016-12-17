var vue = require('vue-loader');
var webpack = require('webpack');
var path = require('path');

var paths = {
    src: './src/',
    dist: './dist/'
};

module.exports = {
    devtool: "eval-source-map",
    entry: {
		app: path.resolve("dev", "main.js")
	},
    output: {
        path: path.resolve("dev"),
		filename: "[name].js",
		publicPath: "/"
    },
    resolve: {
        extensions: ['', '.js', '.vue', '.styl'],
        alias: {
            'src': path.resolve(__dirname, '')
        }
    },
    resolveLoader: {
        root: path.join(__dirname, 'node_modules')
    },
    module: {
        loaders: [
            {
                "test": /\.js?$/,
                "exclude": /node_modules/,
                "loader": "babel"
            },
            {
                "test": /\.vue?$/,
                "loader": "vue"
            }
        ]
    },
    plugins: [
    ]
};