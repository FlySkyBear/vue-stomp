# vue-stomp

Stomp (Websokct) with send message timeout monitor plugin for VueJS.


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
Vue.use(VueStomp, endpoint);
```
or connect to other address:
```js
Vue.use(VueStomp, "http://otherserver:8080/endpoint");
```

##Memo
WM: WithMonitor

Use it in your components:
```html
<script>
    export default {
        data () {
          return {
            invokeIdCnt: 0
          }
        },
        methods: {
          onConnected(frame){
            console.log('Connected: ' + frame);
            ...
            this.$stompClient.subscribe('/topic/username', this.responseCallback, this.onFailed);
          },
          onFailed(frame){
            console.log('Failed: ' + frame);
            ...
          },         
          connectSrv(){
            var headers = {
              "login": 'guest',
              "passcode": 'guest',
              // additional header
              ...
            };
            this.connetWM(headers, this.onConnected, this.onFailed);    
          },
          getInvokeId(){
            let hex = (this.invokeIdCnt++ ).toString(16);
            var zero = '0000';
            var tmp  = 4-hex.length;
            return zero.substr(0,tmp) + hex;
          },
          send(){
              let destination = '/exchange/test'
              let invokeId = this.getInvokeId();
              ...
              let body = msgHead + invokeId + msgBody;
              this.sendWM(destination, body, invokeId, this.responseCallback, 3000);
          },
          responseCallback(frame){
            console.log("responseCallback msg=>" + frame.body);
            let invokeId = frame.body.substr(invokeIdIndex, 4);
            this.removeStompMonitor(invokeId);
          },
          disconnect(){
            this.disconnetWM();
          }
        },
        stompClient:{
          monitorIntervalTime: 100,
          stompReconnect: true,
          timeout(orgCmd) {              
            ...
          }
       }
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

