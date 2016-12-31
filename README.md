# vue-stomp

Stomp (Websokct) plugin for VueJS.


## Install
### NPM
You can install it via [NPM](http://npmjs.org/).
```
$ npm install vue-stomp
```
### Manual
Download zip package and unpack and add the `vue-stomp.js` file to your project from dist folder.
```
https://github.com/FlySkyBear/vue-stomp/archive/master.zip
```

## Usage
Register the plugin, it will connect to `/`
```js
import VueStomp from "vue-stomp";
Vue.use(VueStomp);
```
or connect to other address:
```js
Vue.use(VueStomp, "http://otherserver:8080/endpoint");
```
You can pass options too:
```js
Vue.use(VueStomp, "http://otherserver:8080/endpoint", {
	reconnection: false
});
```


Use it in your components:
```html
<script>
	export default {
		
		methods: {
			init() {
		  		// Emit the server side
		  		this.$stompClient.setTimeoutCallback(timeout);    
			},
			
			timeout() {		  	
				...
	 
			},
			send(){
				this.$stompClient.sendWithMonitor(destination, body, 3000, invokeId, func);
			}
		},
 
	};

</script>
```

## Build
This command will build a distributable version in the `dist` directory.
```bash
npm run build
```

## Test
```bash
npm test
```

## Contribution
Please send pull requests improving the usage and fixing bugs, improving documentation and providing better examples, or providing some testing, because these things are important.

## License
vue-stomp is available under the [MIT license](https://tldrlegal.com/license/mit-license).

## Contact

Copyright (C) 2016 FlySkyBear

