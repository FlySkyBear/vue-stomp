
var webpack = require('webpack');
var path = require('path');

var paths = {
    src: './src/',
    dist: './dist/'
};

module.exports = [
	{
    	devtool: "source-map",
	    entry: "./src/index",
	    output: {
	        path: paths.dist,
	        publicPath: paths.dist,
	        filename: "vue-stomp.js",
	        library: "VueStomp",
	        libraryTarget: "umd"
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
	    plugins: [
	        new webpack.DefinePlugin({
	            "process.env" : {
	                NODE_ENV : JSON.stringify("production")
	            }
	        }),
	        new webpack.optimize.UglifyJsPlugin({
	            compress: {
	                warnings: false
	            }
	        }),
	        new webpack.optimize.DedupePlugin()
	    ],
	    module: {
	        loaders: [
	            {
	                "test": /\.js?$/,
	                "exclude": /node_modules/,
	                "loader": "babel"
	            },
	            {
	                "test": /\.vue$/,
	                "loader": "vue"
	            }
	        ]
	    },
        node: {
		  fs: "empty"
		}
	}

];