import SockJS from "sockjs-client";
import Stomp from "webstomp-client";

export default {
  install(Vue) {
    const keyPrefix = "_";

    // zh:设置监视回调的KEY前缀（防数字化）
    // ja:監視用コールバックキーのプレフィックスを設定する(数字化防止)
    // en:Set the monitor callback key（fobbidden the number automotic convert）
    Vue.prototype.keyPrefix = keyPrefix;

    /**
     * zh:定义送信应答监视函数
     * ja:
     * en:Define the function of the response
     * destination: 送信对象 | 送信先 | topic id
     * body: 发送内容 | 送信内容 |
     * invokeId: 唯一识别码 | 一意識別コード | Unique identification code）
     * timeout: 超时时间  | タイムアウト時刻 | time out 
     * headers: stomp消息自定义头部 | stompメッセージカスタマイズ化ヘッダー | customic header of the stomp message
     */
    let sendW = function(destination, body = '', invokeId, func, timeout = 3000, headers = {}) {
      // zh: 确保第四参数为函数
      // ja: 四番パラメタを関数に確保する
      // en: make sure that the fourth argument is a function
      if (typeof func !== 'function') {
        throw {
          name : 'Vue Stomp Error',
          message : 'The fourth argument must be a function.'
        };
      }
      // zh: 确保第四参数为函数
      // ja: 四番パラメタを関数に確保する
      // en: make sure that the fourth argument is a function
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
      // zh:追加要监视的指令
      // ja:監視指令を追加する
      // en:Insert the monitor event
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
      // zh:原始的送信函数调用
      // ja:プロトタイプ送信関数を呼び出す
      // en:Call the prototype send function
      this.$stompClient.send(destination, body, headers);
    };

    // zh:送信应答监视函数为原型函数
    // ja:送信応答監視関数をプロトタイプ関数として設定する
    // en:Set the monitor function to prototype function
    Vue.prototype.sendWM = sendWM;

    // zh:清除监视函数
    // ja:監視関数をクリアする
    // en:Clear the monitor function
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
    // zh:清除监视函数为原型函数
    // ja:削除用監視関数をプロトタイプ関数として設定する
    // en:Set the delete monitor function to prototype function
    Vue.prototype.removeStompMonitor = removeStompMonitor;

    let reconnErrorCallback = function(errorEvent){
      if(errorEvent.type == 'close' && this.stompReconnect == true){
        console.log("reconnErrorCallback reconnect required!");
        this.reconnecting = true;
        // zh:发起连接
        // ja:接続開始
        // en:Start connnection...
        this.connetWM(this.connectParams.serverEndPoint, this.connectParams.headers,
           this.connectParams.connectCallback, this.connectParams.errorCallback);
      }
      if(this.errorCallback) this.errorCallback(errorEvent);
    };
    Vue.prototype.reconnErrorCallback = reconnErrorCallback;

    let connetWM = function(serverEndPoint, ...args){
      // zh:已连接时直接返回，避免多重连接
      // ja:すでに接続している場合、すぐリターン。複数接続を防止する
      // en:If the connection has established, then return. Avoid multiple connections 
      if(this.$stompClient && this.$stompClient.connected)
      {
        return;
      }
      let socket = new SockJS(serverEndPoint);
 
      let stompClient = Stomp.over(socket);
      Vue.prototype.$stompClient = stompClient;

      if (this.stompReconnect == true && this.reconnecting != true){
        switch(args.length){
          case 3:
            if (args[1] instanceof Function){
                let errorCallback = args[2];
                args[2] = this.reconnErrorCallback.bind(this);
                this.errorCallback = errorCallback;
            }
            break;
          case 4:
          default:
            let errorCallback = args[3];
            args[3] = this.reconnErrorCallback;
            this.errorCallback = errorCallback;
        }
        // zh:保存连接参数
        // ja:接続パラメタを保存する
        // en:Save the connection parameters
        let [headers, connectCallback, errorCallback] = this.$stompClient._parseConnect(...args);
        let connectParams = {
          "serverEndPoint" : serverEndPoint,
          "headers" : headers,
          "connectCallback" : connectCallback,
          "errorCallback" : errorCallback
        }
        this.connectParams = connectParams;
      }
      this.reconnecting = false;

      this.$stompClient.connect(...args);
      // zh:初始监控队列
      // ja:監視キューを初期化
      // en:Initial the monitor queue 
      this.monitorEvents = [];
      // zh:启动监视
      // ja:開始監視
      // en:Start monitor
      if(this.responseMonitor == null){
        this.responseMonitor = setInterval(() => {
          let now = Date.now();
          for (let mEventIndex in this.monitorEvents) {
            let monitorParm = this.monitorEvents[mEventIndex];
            if(monitorParm){
              let delta = now - monitorParm.sendTime;
              // zh:判断是否超时
              // ja:タイムアウトをチェックする
              // en:Check timeout
              if (delta > monitorParm.timeout) {
                // zh:超时回调处理
                // ja:タイムアウトコールバック
                // en:Timeout callback
                if(typeof this.timeoutCallback == 'function' ){
                  this.timeoutCallback(monitorParm.cmd);
                }
                // zh:清除此事件
                // ja:イベントをクリアする
                // en:Clear the event
                delete this.monitorEvents[mEventIndex];
              }
            }
          }
        }, this.monitorIntervalTime);
      }
    }
    // zh:带监视的连接函数为原型函数
    // ja:監視機能を付け接続関数をプロトタイプ関数として設定する
    // en:Set the connection function that with monitor function
    Vue.prototype.connetWM = connetWM;  
    // zh:初始参数设置
    // ja:初期値設定
    // en:Set initial value
    let addListeners = function() {
      if (this.$options["stompClient"]) {
        let conf = this.$options.stompClient;
        // zh:设置超时回调函数
        // ja:タイムアウトコールバック関数を設定する
        // en:Set the timeout callback function 
        if (conf.timeout){ 
          if( typeof conf.timeout !== 'function') {
            throw {
              name : 'Vue Stomp Error',
              message : 'The argument[timeout] must be a function.'
            };
          }
          this.timeoutCallback = conf.timeout;
        }
        // zh:监视轮询时间设置
        // ja:監視ポーリング時間を設定する
        // en:Set Monitor polling time 
        let monitorIntervalTime = 100;
        if(conf.monitorIntervalTime &&  typeof conf.monitorIntervalTime === 'number' && !isNaN(conf.monitorIntervalTime) ){
          monitorIntervalTime = conf.monitorIntervalTime;
        }
        this.monitorIntervalTime = monitorIntervalTime;
        // zh:设置是否要重连
        // ja:リコネクションを設定する
        // en:Set reconnect
        if(conf.stompReconnect){
          this.stompReconnect = conf.stompReconnect;
        }
      }
    };
    // zh:断开连接处理
    // ja:切断処理
    // en:disconnect
    let disconnetWM = function(){
      // zh:断开连接
      // ja:切断
      // en:disconnect
      if( this.$stompClient && this.$stompClient.connected){
        this.$stompClient.disconnect();
      }

      // zh:清除所有监视对象
      // ja:すべで監視対象をクリアする
      // en:Clear all of monitor target
      clearInterval(this.responseMonitor);
      this.responseMonitor = null;

    };
    Vue.prototype.disconnetWM = disconnetWM;

    // zh:初始参数移除
    // ja:初期値を削除する
    // en:Delete the initial value
    let removeListeners = function() {
      if (this.$options["stompClient"]) {
        this.disconnetWM();

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
