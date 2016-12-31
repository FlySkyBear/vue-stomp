import Stomp from "webstomp-client";
import Sockjs from "sockjs-client";

export default {

	install(Vue, serverEndPoint, opts) {
		const keyPrefix = "_";

        let socket = new SockJS(serverEndPoint);
        
        let stompClient = Stomp.over(socket);

        // 设置监视回调的KEY前缀（防数字化）
        stompClient.prototype.keyPrefix =keyPrefix;

        // 监视轮询时间设置
        let monitorIntervalTime = 100;
        if(typeof opts.monitorIntervalTime === 'number' && !isNaN(opts.monitorIntervalTime) ){
        	monitorIntervalTime = opts.monitorIntervalTime;
        }
        stompClient.prototype.monitorIntervalTime = monitorIntervalTime;
        
        // 初始监控队列
        stompClient.prototype.monitorEvents = [];

        // 设置超时回调函数
        stompClient.prototype.setTimeoutCallback = function(callback){
        	// make sure that the second argument is a function
			if (typeof callback !== 'function') {
				throw {
					name : 'Vue Stomp Error',
					message : 'The first argument must be a function.'
				};
			}
        	this.prototype.timeoutCallback = callback;
        }

        /**
         * 定义送信应答监视函数
         * invokeId: 唯一识别码
         */
		let sendWithMonitor = function(destination, body = '', timeout = 3000, invokeId, func, headers = {}) {
			// make sure that the second argument is a function
			if (typeof func !== 'function') {
				throw {
					name : 'Vue Stomp Error',
					message : 'The fifth argument must be a function.'
				};
			}
			// make sure that the second argument is a function
			if (invokeId == null) {
				throw {
					name : 'Vue Stomp Error',
					message : 'The fourth argument must not be null.'
				};
			}

			// 追加要监视的指令
			if (this.monitorEvents) {
				let key = this.keyPrefix + invokeId;
				if (!this.monitorEvents[key]) {
					this.monitorEvents[key] = [];
				} else {
					// make sure that this callback doesn't exist already
					for (var i = 0, len = this.monitorEvents[key].length; i < len; i++) {
						if (this.monitorEvents[key][i] === fn) {
							throw {
								name : 'WSStomp Error',
								message : 'This callback function was already added.'
							};
						}
					}
				}
				let monitorParm = {
					"cmd": body,
					"sendTime": Date.now(),
					"timeout": timeout,
					"func": func
				}
				this.monitorEvents[key].push(monitorParm);
			}
			// 原始的送信调用
			this.send(destination, body, headers);

			// 启动监视
			if(this.responseMonitor == null){
				this.responseMonitor = setInterval(() => {
					let now = Date.now();
					for (let mEventIndex in this.monitorEvents) {
						let monitorParm = this.monitorEvents[mEventIndex];
						let delta = now - monitorParm.sendTime;
						 // We wait twice the TTL to be flexible on window's setInterval calls
		                if (delta > monitorParm.timeout) {
		                    // 超时回调
		                    if(typeof this.timeoutCallback == 'function' ){
			                    this.timeoutCallback(monitorParm.cmd);
			            	}
		                    // 清除此事件
		                    delete this.monitorEvents[mEventIndex];
		                }
					}
	            }, this.monitorIntervalTime);
			}
		};

        // 送信应答监视函数设备为Stomp原型函数
		stompClient.prototype.sendWithMonitor = sendWithMonitor;

		// 清除监视函数
		let removeStompMonitor = function(invokeId) {
			// make sure that the second argument is a function
			if (invokeId == null) {
				throw {
					name : 'Vue Stomp Error',
					message : 'The first argument must not be null.'
				};
			}
			let key = this.keyPrefix + invokeId;
			if(this.monitorEvents[key] != null){
				delete this.monitorEvents[key];
			}
		};
		// 清除监视函数为Stomp原型函数
		stompClient.prototype.removeStompMonitor = removeStompMonitor;

		Vue.prototype.$stompClient = stompClient;

		// 清除所有监视对象
		let cleanStompMonitor = function(){
			clearInterval(this.$stompClient.responseMonitor);
			delete this.$stompClient.monitorEvents;
		};

		Vue.mixin({
			beforeDestroy: cleanStompMonitor
		});

	}

};
