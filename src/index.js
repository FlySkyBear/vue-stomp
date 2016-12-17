import SockJS from "sockjs-client";
import Stomp from "webstomp-client";
import WebSocket from "ws";

export default {

	install(Vue, connection, opts) {

        let socket = null;
        // console.log('1 this.sever: ' + this.server);
        if(this.server.search('/ws') >= 0 ){
            this.server = this.server.replace("http://", "ws://");
            //console.log('2 this.sever: ' + this.server);
            socket = new WebSocket(this.server);
        }else{
            socket = new SockJS(this.server);
        }
        var client = Stomp.over(socket);

        var headers = {
            login: opts.username,
            passcode: opts.pwd,
            // additional header
            'thirdPartyTypeId': opts.thirdPartyTypeId
        };
        if(headers.thirdPartyTypeId == null){
            headers.thirdPartyTypeId = 'SELF';
        }
        client.connect(headers, function(frame) {
            callback(false, client);
            // console.log('Connected: ' + frame);
        }, function(error) {
            callback(true, client);
            // display the error's message header:
            console.log(error);
        });
		Vue.prototype.$socket = socket;

		let addListeners = function() {
			if (this.$options["socket"]) {
				let conf = this.$options.socket;
				if (conf.namespace) {					
					this.$socket = Stomp(conf.namespace, conf.options);
				}

				if (conf.events) {
					let prefix = conf.prefix || "";
					Object.keys(conf.events).forEach((key) => {
						let func = conf.events[key].bind(this);
						this.$socket.on(prefix + key, func);
						conf.events[key].__binded = func;
					});
				}
			}
		};

		let removeListeners = function() {
			if (this.$options["socket"]) {
				let conf = this.$options.socket;

				if (conf.namespace) {
					this.$socket.disconnect();
				}

				if (conf.events) {
					let prefix = conf.prefix || "";
					Object.keys(conf.events).forEach((key) => {
						this.$socket.off(prefix + key, conf.events[key].__binded);
					});
				}
			}
		};

		Vue.mixin({
			// Vue v1.x
			beforeCompile: addListeners,
			
			// Vue v2.x
			beforeCreate: addListeners,


			beforeDestroy: removeListeners
		});

	}

};
