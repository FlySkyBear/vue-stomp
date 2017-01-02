import SockJS from "sockjs-client";
import Stomp from "webstomp-client";

export default {
  install(Vue) {
    const keyPrefix = "_";

    // 设置监视回调的KEY前缀（防数字化）
    Vue.prototype.keyPrefix = keyPrefix;

    /**
     * 定义送信应答监视函数
     * invokeId: 唯一识别码
     */
    let sendWithMonitor = function(destination, body = '', invokeId, func, timeout = 3000, headers = {}) {
      // make sure that the second argument is a function
      if (typeof func !== 'function') {
        throw {
          name : 'Vue Stomp Error',
          message : 'The fourth argument must be a function.'
        };
      }
      // make sure that the second argument is a function
      if (invokeId == null) {
        throw {
          name : 'Vue Stomp Error',
          message : 'The third argument must not be null.'
        };
      }

      if(this.$stompClient == null || !this.$stompClient.connected){
        throw {
          name : 'Vue Stomp Error',
          message : 'The connection is not established.'
        };
      }
      // 追加要监视的指令
      if (this.monitorEvents) {
        let key = this.keyPrefix + invokeId;
        let monitorParm = {
          "cmd": body,
          "sendTime": Date.now(),
          "timeout": timeout,
          "func": func
        }
        this.monitorEvents[key] = monitorParm;
      }
      // 原始的送信调用
      this.$stompClient.send(destination, body, headers);
    };

    // 送信应答监视函数设备为Stomp原型函数
    Vue.prototype.sendWithMonitor = sendWithMonitor;

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
    Vue.prototype.removeStompMonitor = removeStompMonitor;

    let connetWithMonitor = function(serverEndPoint, ...args){
      // 已连接时直接返回，避免多重连接
      if(this.$stompClient && this.$stompClient.connected)
      {
        return;
      }
      let socket = new SockJS(serverEndPoint);
 
      let stompClient = Stomp.over(socket);
      Vue.prototype.$stompClient = stompClient;

      this.$stompClient.connect(...args);
      // 初始监控队列
          this.monitorEvents = [];
      // 启动监视
      if(this.responseMonitor == null){
        this.responseMonitor = setInterval(() => {
          let now = Date.now();
          for (let mEventIndex in this.monitorEvents) {
            let monitorParm = this.monitorEvents[mEventIndex];
            if(monitorParm){
              let delta = now - monitorParm.sendTime;
              // 判断是否超时
              if (delta > monitorParm.timeout) {
                // 超时回调处理
                if(typeof this.timeoutCallback == 'function' ){
                  this.timeoutCallback(monitorParm.cmd);
                }
                // 清除此事件
                delete this.monitorEvents[mEventIndex];
              }
            }
          }
        }, this.monitorIntervalTime);
      }
    }
    // 带监视的连接函数为Stomp原型函数
    Vue.prototype.connetWithMonitor = connetWithMonitor;  
    // 初始参数设置
    let addListeners = function() {
      if (this.$options["stompClient"]) {
        let conf = this.$options.stompClient;
        if (conf.timeout){ // 设置超时回调函数
          if( typeof conf.timeout !== 'function') {
            throw {
              name : 'Vue Stomp Error',
              message : 'The argument[timeout] must be a function.'
            };
          }
          this.timeoutCallback = conf.timeout;
        }
        // 监视轮询时间设置
        let monitorIntervalTime = 100;
        if(conf.monitorIntervalTime &&  typeof conf.monitorIntervalTime === 'number' && !isNaN(conf.monitorIntervalTime) ){
          monitorIntervalTime = conf.monitorIntervalTime;
        }
        this.monitorIntervalTime = monitorIntervalTime;
      }
    };
    // 断开连接处理
    let disconnetWithMonitor = function(){
      // 断开连接
      if( this.$stompClient && this.$stompClient.connected){
        this.$stompClient.disconnect();
      }

      // 清除所有监视对象
      clearInterval(this.responseMonitor);
      this.responseMonitor = null;

    };
    Vue.prototype.disconnetWithMonitor = disconnetWithMonitor;

    // 初始参数移除
    let removeListeners = function() {
      if (this.$options["stompClient"]) {
        this.disconnetWithMonitor();

        delete this.monitorEvents;

        delete this.timeoutCallback;
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
