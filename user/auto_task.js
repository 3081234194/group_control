var black_list = ["互动消息","订单消息","系统通知","订阅消息"]
var args = engines.myEngine().execArgv;
var  reply_words = args.reply_words;
var secret_code = args.secret_code;
var gender_choose = args.gender_choose
var words = String(args.words)
var server_url = "http://120.79.0.9:6050"//服务器地址
words = words.split("|")
var belong_key = "0"
console.show()
if(!images.requestScreenCapture())
{
    console.error("未获取截图权限,脚本退出")
    exit();
}
log("正在验证卡密")
toast("按音量下键停止脚本")
threads.start(function(){
    events.setKeyInterceptionEnabled("volume_down",true);
    //监听按键
    events.observeKey();
    events.onKeyDown("volume_down", function(event){
        toast("已关闭脚本！");
        console.hide()
        engines.myEngine().forceStop();
    });
});
const PJYSDK = (function(){
    function PJYSDK(app_key, app_secret){
        http.__okhttp__.setMaxRetries(0);
        http.__okhttp__.setTimeout(10*1000);

        this.event = events.emitter();
        this.debug = true;
        this._lib_version = "v1.07";
        this._protocol = "https";
        this._host = "api.paojiaoyun.com";
        this._device_id = this.getDeviceID();
        this._retry_count = 9;
        
        this._app_key = app_key;
        this._app_secret = app_secret;
        
        this._card = null;
        this._username = null;
        this._password = null;
        this._token = null;
        
        this.is_trial = false;  // 是否是试用用户
        this.login_result = {
            "card_type": "",
            "expires": "",
            "expires_ts": 0,
            "config": "",
        };

        this._auto_heartbeat = true;  // 是否自动开启心跳任务
        this._heartbeat_gap = 60 * 1000; // 默认60秒
        this._heartbeat_task = null;
        this._heartbeat_ret = {"code": -9, "message": "还未开始验证"};

        this._prev_nonce = null;
    }
    PJYSDK.prototype.SetCard = function(card) {
        this._card = card;
    }
    PJYSDK.prototype.SetUser = function(username, password) {
        this._username = username;
        this._password = password;
    }
    PJYSDK.prototype.getDeviceID = function() {
        let id = device.serial;
        if (id == null || id == "" || id == "unknown") {
            id = device.getAndroidId();
        }
        if (id == null || id == "" || id == "unknown") {
            id = device.getIMEI();
        }
        return id;
    }
    PJYSDK.prototype.MD5 = function(str) {
        try {
            let digest = java.security.MessageDigest.getInstance("md5");
            let result = digest.digest(new java.lang.String(str).getBytes("UTF-8"));
            let buffer = new java.lang.StringBuffer();
            for (let index = 0; index < result.length; index++) {
                let b = result[index];
                let number = b & 0xff;
                let str = java.lang.Integer.toHexString(number);
                if (str.length == 1) {
                    buffer.append("0");
                }
                buffer.append(str);
            }
            return buffer.toString();
        } catch (error) {
            alert(error);
            return "";
        }
    }
    PJYSDK.prototype.getTimestamp = function() {
        try {
            let res = http.get("http://api.m.taobao.com/rest/api3.do?api=mtop.common.getTimestamp");
            let data = res.body.json();
            return Math.floor(data["data"]["t"]/1000);
        } catch (error) {
            return Math.floor(new Date().getTime()/1000);
        }
    }
    PJYSDK.prototype.genNonce = function() {
        const ascii_str = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let tmp = '';
        for(let i = 0; i < 20; i++) {
            tmp += ascii_str.charAt(Math.round(Math.random()*ascii_str.length));
        }
        return this.MD5(this.getDeviceID() + tmp);
    }
    PJYSDK.prototype.joinParams = function(params) {
        let ps = [];
        for (let k in params) {
            ps.push(k + "=" + params[k])
        }
        ps.sort()
        return ps.join("&")
    }
    PJYSDK.prototype.CheckRespSign = function(resp) {
        if (resp.code != 0 && resp.nonce === "" && resp.sign === "") {
            return resp
        }

        let ps = "";
        if (resp["result"]) {
            ps = this.joinParams(resp["result"]);
        }

        let s = resp["code"] + resp["message"] + ps + resp["nonce"] + this._app_secret;
        let sign = this.MD5(s);
        if (sign === resp["sign"]) {
            if (this._prev_nonce === null) {
                this._prev_nonce = resp["nonce"];
                return {"code":0, "message":"OK"};
            } else {
                if (this._prev_nonce === resp["nonce"]) {
                    return {"code": -98, "message": "轻点，疼~"};
                } else {
                    this._prev_nonce = resp["nonce"];
                    return {"code": 0, "message": "OK"};
                }
            }
        }
        return {"code": -99, "message": "轻点，疼~"};
    }
    PJYSDK.prototype.retry_fib = function(num) {
        if (num > 9) {
            return 34
        }
        let a = 0;
        let b = 1;
        for (i = 0; i < num; i++) {
            let tmp = a + b;
            a = b
            b = tmp
        }
        return a
    }
    PJYSDK.prototype._debug = function(path, params, result) {
        if (this.debug) {
            log("\n" + path, "\nparams:", params, "\nresult:", result);
        }
    }
    PJYSDK.prototype.Request = function(method, path, params) {
        // 构建公共参数
        params["app_key"] = this._app_key;

        method = method.toUpperCase();
        let url = this._protocol + "://" + this._host + path
        let max_retries = this._retry_count;
        let retries_count = 0;

        let data = {"code": -1, "message": "连接服务器失败"};
        do {
            retries_count++;
            let sec = this.retry_fib(retries_count);

            delete params["sign"]
            params["nonce"] = this.genNonce();
            params["timestamp"] = this.getTimestamp();
            let ps = this.joinParams(params);
            let s = method + this._host + path + ps + this._app_secret;
            let sign = this.MD5(s);
            params["sign"] = sign;

            let resp, body;
            try {    
                if (method === "GET") {
                    resp = http.get(url + "?" + ps + "&sign=" + sign);
                } else {  // POST
                    resp = http.post(url, params);
                }
                body = resp.body.string();
                data = JSON.parse(body);
                this._debug(method+'-'+path+':', params, data);
                
                let crs = this.CheckRespSign(data);
                if (crs.code !== 0) {
                    return crs;
                } else {
                    return data;
                }
            } catch (error) {
                log("[*] request error: ", error, sec + "s后重试");
                this._debug(method+'-'+path+':', params, body)
                sleep(sec*1000);
            }
        } while (retries_count < max_retries);

        return data;
    }
    /* 通用 */
    PJYSDK.prototype.GetHeartbeatResult = function() {
        return this._heartbeat_ret;
    }
    PJYSDK.prototype.GetTimeRemaining = function() {
        let g = this.login_result.expires_ts - this.getTimestamp();
        if (g < 0) {
            return 0;
        } 
        return g;
    }
    /* 卡密相关 */
    PJYSDK.prototype.CardLogin = function() {  // 卡密登录
        if (!this._card) {
            return {"code": -4, "message": "请先设置卡密"};
        }
        if (this._token) {
            return {"code": -3, "message": "请先退出登录"};
        }
        let method = "POST";
        let path = "/v1/card/login";
        let data = {"card": this._card, "device_id": this._device_id};
        let ret = this.Request(method, path, data);
        if (ret.code == 0) {
            this._token = ret.result.token;
            this.login_result = ret.result;
            if (this._auto_heartbeat) {
                this._startCardHeartheat();
            }
        }
        return ret;
    }
    PJYSDK.prototype.CardHeartbeat = function() {  // 卡密心跳，默认会自动调用
        if (!this._token) {
            return {"code": -2, "message": "请在卡密登录成功后调用"};
        }
        let method = "POST";
        let path = "/v1/card/heartbeat";
        let data = {"card": this._card, "token": this._token};
        let ret = this.Request(method, path, data);
        if (ret.code == 0) {
            this.login_result.expires = ret.result.expires;
            this.login_result.expires_ts = ret.result.expires_ts;
        }
        return ret;
    }
    PJYSDK.prototype._startCardHeartheat = function() {  // 开启卡密心跳任务
        if (this._heartbeat_task) {
            this._heartbeat_task.interrupt();
            this._heartbeat_task = null;
        }
        this._heartbeat_task = threads.start(function(){
            setInterval(function(){}, 10000);
        });
        this._heartbeat_ret = this.CardHeartbeat();
        
        this._heartbeat_task.setInterval((self) => {
            self._heartbeat_ret = self.CardHeartbeat();
            if (self._heartbeat_ret.code != 0) {
                self.event.emit("heartbeat_failed", self._heartbeat_ret);
            }
        }, this._heartbeat_gap, this);

        this._heartbeat_task.setInterval((self) => {
            if (self.GetTimeRemaining() == 0) {
                self.event.emit("heartbeat_failed", {"code": 10210, "message": "卡密已过期！"});
            }
        }, 1000, this);
    }
    PJYSDK.prototype.CardLogout = function() {  // 卡密退出登录
        this._heartbeat_ret = {"code": -9, "message": "还未开始验证"};
        if (this._heartbeat_task) { // 结束心跳任务
            this._heartbeat_task.interrupt();
            this._heartbeat_task = null;
        }
        if (!this._token) {
            return {"code": 0, "message": "OK"};
        }
        let method = "POST";
        let path = "/v1/card/logout";
        let data = {"card": this._card, "token": this._token};
        let ret = this.Request(method, path, data);
        // 清理
        this._token = null;
        this.login_result = {
            "card_type": "",
            "expires": "",
            "expires_ts": 0,
            "config": "",
        };
        return ret;
    }
    PJYSDK.prototype.CardUnbindDevice = function() { // 卡密解绑设备，需开发者后台配置
        if (!this._token) {
            return {"code": -2, "message": "请在卡密登录成功后调用"};
        }
        let method = "POST";
        let path = "/v1/card/unbind_device";
        let data = {"card": this._card, "device_id": this._device_id, "token": this._token};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.SetCardUnbindPassword = function(password) { // 自定义设置解绑密码
        if (!this._token) {
            return {"code": -2, "message": "请在卡密登录成功后调用"};
        }
        let method = "POST";
        let path = "/v1/card/unbind_password";
        let data = {"card": this._card, "password": password, "token": this._token};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.CardUnbindDeviceByPassword = function(password) { // 用户通过解绑密码解绑设备
        let method = "POST";
        let path = "/v1/card/unbind_device/by_password";
        let data = {"card": this._card, "password": password};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.CardRecharge = function(card, use_card) { // 以卡充卡
        let method = "POST";
        let path = "/v1/card/recharge";
        let data = {"card": card, "use_card": use_card};
        return this.Request(method, path, data);
    }
    /* 用户相关 */
    PJYSDK.prototype.UserRegister = function(username, password, card) {  // 用户注册（通过卡密）
        let method = "POST";
        let path = "/v1/user/register";
        let data = {"username": username, "password": password, "card": card, "device_id": this._device_id};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.UserLogin = function() {  // 用户账号登录
        if (!this._username || !this._password) {
            return {"code": -4, "message": "请先设置用户账号密码"};
        }
        if (this._token) {
            return {"code": -3, "message": "请先退出登录"};
        }
        let method = "POST";
        let path = "/v1/user/login";
        let data = {"username": this._username, "password": this._password, "device_id": this._device_id};
        let ret = this.Request(method, path, data);
        if (ret.code == 0) {
            this._token = ret.result.token;
            this.login_result = ret.result;
            if (this._auto_heartbeat) {
                this._startUserHeartheat();
            }
        }
        return ret;
    }
    PJYSDK.prototype.UserHeartbeat = function() {  // 用户心跳，默认会自动开启
        if (!this._token) {
            return {"code": -2, "message": "请在用户登录成功后调用"};
        }
        let method = "POST";
        let path = "/v1/user/heartbeat";
        let data = {"username": this._username, "token": this._token};
        let ret = this.Request(method, path, data);
        if (ret.code == 0) {
            this.login_result.expires = ret.result.expires;
            this.login_result.expires_ts = ret.result.expires_ts;
        }
        return ret;
    }
    PJYSDK.prototype._startUserHeartheat = function() {  // 开启用户心跳任务
        if (this._heartbeat_task) {
            this._heartbeat_task.interrupt();
            this._heartbeat_task = null;
        }
        this._heartbeat_task = threads.start(function(){
            setInterval(function(){}, 10000);
        });
        this._heartbeat_ret = this.UserHeartbeat();

        this._heartbeat_task.setInterval((self) => {
            self._heartbeat_ret = self.UserHeartbeat();
            if (self._heartbeat_ret.code != 0) {
                self.event.emit("heartbeat_failed", self._heartbeat_ret);
            }
        }, this._heartbeat_gap, this);

        this._heartbeat_task.setInterval((self) => {
            if (self.GetTimeRemaining() == 0) {
                self.event.emit("heartbeat_failed", {"code": 10250, "message": "用户已到期！"});
            }
        }, 1000, this);
    }
    PJYSDK.prototype.UserLogout = function() {  // 用户退出登录
        this._heartbeat_ret = {"code": -9, "message": "还未开始验证"};
        if (this._heartbeat_task) { // 结束心跳任务
            this._heartbeat_task.interrupt();
            this._heartbeat_task = null;
        }
        if (!this._token) {
            return {"code": 0, "message": "OK"};
        }
        let method = "POST";
        let path = "/v1/user/logout";
        let data = {"username": this._username, "token": this._token};
        let ret = this.Request(method, path, data);
        // 清理
        this._token = null;
        this.login_result = {
            "card_type": "",
            "expires": "",
            "expires_ts": 0,
            "config": "",
        };
        return ret;
    }
    PJYSDK.prototype.UserChangePassword = function(username, password, new_password) {  // 用户修改密码
        let method = "POST";
        let path = "/v1/user/password";
        let data = {"username": username, "password": password, "new_password": new_password};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.UserRecharge = function(username, card) { // 用户通过卡密充值
        let method = "POST";
        let path = "/v1/user/recharge";
        let data = {"username": username, "card": card};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.UserUnbindDevice = function() { // 用户解绑设备，需开发者后台配置
        if (!this._token) {
            return {"code": -2, "message": "请在用户登录成功后调用"};
        }
        let method = "POST";
        let path = "/v1/user/unbind_device";
        let data = {"username": this._username, "device_id": this._device_id, "token": this._token};
        return this.Request(method, path, data);
    }
    /* 配置相关 */
    PJYSDK.prototype.GetCardConfig = function() { // 获取卡密配置
        let method = "GET";
        let path = "/v1/card/config";
        let data = {"card": this._card};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.UpdateCardConfig = function(config) { // 更新卡密配置
        let method = "POST";
        let path = "/v1/card/config";
        let data = {"card": this._card, "config": config};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.GetUserConfig = function() { // 获取用户配置
        let method = "GET";
        let path = "/v1/user/config";
        let data = {"user": this._username};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.UpdateUserConfig = function(config) { // 更新用户配置
        let method = "POST";
        let path = "/v1/user/config";
        let data = {"username": this._username, "config": config};
        return this.Request(method, path, data);
    }
    /* 软件相关 */
    PJYSDK.prototype.GetSoftwareConfig = function() { // 获取软件配置
        let method = "GET";
        let path = "/v1/software/config";
        return this.Request(method, path, {});
    }
    PJYSDK.prototype.GetSoftwareNotice = function() { // 获取软件通知
        let method = "GET";
        let path = "/v1/software/notice";
        return this.Request(method, path, {});
    }
    PJYSDK.prototype.GetSoftwareLatestVersion = function(current_ver) { // 获取软件最新版本
        let method = "GET";
        let path = "/v1/software/latest_ver";
        let data = {"version": current_ver};
        return this.Request(method, path, data);
    }
    /* 试用功能 */
    PJYSDK.prototype.TrialLogin = function() {  // 试用登录
        let method = "POST";
        let path = "/v1/trial/login";
        let data = {"device_id": this._device_id};
        let ret = this.Request(method, path, data);
        if (ret.code == 0) {
            this.is_trial = true;
            this.login_result = ret.result;
            if (this._auto_heartbeat) {
                this._startTrialHeartheat();
            }
        }
        return ret;
    }
    PJYSDK.prototype.TrialHeartbeat = function() {  // 试用心跳，默认会自动调用
        let method = "POST";
        let path = "/v1/trial/heartbeat";
        let data = {"device_id": this._device_id};
        let ret = this.Request(method, path, data);
        if (ret.code == 0) {
            this.login_result.expires = ret.result.expires;
            this.login_result.expires_ts = ret.result.expires_ts;
        }
        return ret;
    }
    PJYSDK.prototype._startTrialHeartheat = function() {  // 开启试用心跳任务
        if (this._heartbeat_task) {
            this._heartbeat_task.interrupt();
            this._heartbeat_task = null;
        }
        this._heartbeat_task = threads.start(function(){
            setInterval(function(){}, 10000);
        });
        this._heartbeat_ret = this.TrialHeartbeat();

        this._heartbeat_task.setInterval((self) => {
            self._heartbeat_ret = self.CardHeartbeat();
            if (self._heartbeat_ret.code != 0) {
                self.event.emit("heartbeat_failed", self._heartbeat_ret);
            }
        }, this._heartbeat_gap, this);

        this._heartbeat_task.setInterval((self) => {
            if (self.GetTimeRemaining() == 0) {
                self.event.emit("heartbeat_failed", {"code": 10407, "message": "试用已到期！"});
            }
        }, 1000, this);
    }
    PJYSDK.prototype.TrialLogout = function() {  // 试用退出登录，没有http请求，只是清理本地记录
        this.is_trial = false;
        this._heartbeat_ret = {"code": -9, "message": "还未开始验证"};
        if (this._heartbeat_task) { // 结束心跳任务
            this._heartbeat_task.interrupt();
            this._heartbeat_task = null;
        }
        // 清理
        this._token = null;
        this.login_result = {
            "card_type": "",
            "expires": "",
            "expires_ts": 0,
            "config": "",
        };
        return {"code": 0, "message": "OK"};;
    }
    /* 高级功能 */
    PJYSDK.prototype.GetRemoteVar = function(key) { // 获取远程变量
        let method = "GET";
        let path = "/v1/af/remote_var";
        let data = {"key": key};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.GetRemoteData = function(key) { // 获取远程数据
        let method = "GET";
        let path = "/v1/af/remote_data";
        let data = {"key": key};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.CreateRemoteData = function(key, value) { // 创建远程数据
        let method = "POST";
        let path = "/v1/af/remote_data";
        let data = {"action": "create", "key": key, "value": value};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.UpdateRemoteData = function(key, value) { // 修改远程数据
        let method = "POST";
        let path = "/v1/af/remote_data";
        let data = {"action": "update", "key": key, "value": value};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.DeleteRemoteData = function(key, value) { // 删除远程数据
        let method = "POST";
        let path = "/v1/af/remote_data";
        let data = {"action": "delete", "key": key};
        return this.Request(method, path, data);
    }
    PJYSDK.prototype.CallRemoteFunc = function(func_name, params) { // 执行远程函数
        let method = "POST";
        let path = "/v1/af/call_remote_func";
        let ps = JSON.stringify(params);
        let data = {"func_name": func_name, "params": ps};
        let ret = this.Request(method, path, data);
        if (ret.code == 0 && ret.result.return) {
            ret.result = JSON.parse(ret.result.return);
        }
        return ret;
    }
    return PJYSDK;
})();


/* 将PJYSDK.js文件中的代码复制粘贴到上面 */

// AppKey 和 AppSecret 在泡椒云开发者后台获取
let pjysdk = new PJYSDK("bs9s2kso6itf686ifgs0", "1P47v2sZz4rJfbht2kXBTMCA21pB3Zeh"); 
pjysdk.debug = false;
pjysdk.SetCard(secret_code);

// 监听心跳失败事件
pjysdk.event.on("heartbeat_failed", function(hret) {
    toast(hret.message);  // 失败提示信息
    exit();  // 退出脚本
})

let login_ret = pjysdk.CardLogin();
if (login_ret.code == 0) {
    // 登录成功，后面写你的业务代码
    console.info("卡密验证成功")
    let left_time = pjysdk.GetTimeRemaining();

    console.info("剩余时长:"+Math.round(left_time/3600)+"时"+Math.round(left_time%3600/60)+"分")
    main();

} else {
    // 登录失败提示
    toast(login_ret.message);
}
// 用户主动退出时记得调用logout
pjysdk.CardLogout();
function main()
{
    app.launchApp("比心陪练")
    log("等待进入主界面")
    sleep(6000)
    boundsInside(0,device.height*0.7,device.width,device.height).text("消息").findOne().parent().parent().click()
    sleep(2000)
    let unread = id("txvUnread").find()
    for(let i=0;i<unread.length;i++)
    {
        name = unread[i].parent().parent().child(1).text()
        if(black_list.indexOf(name)==-1)black_list.push(name);
    }
    while(true)
    {
        log("论询消息.....")
        check_unread()
        sleep(30000)
        boundsInside(0,device.height*0.7,device.width,device.height).text("我的").findOne().parent().parent().click()
        log("检查访客中")
        let visitor_num = check_visitor_num()
        if(visitor_num>0)
        {
            text("访客").findOne().parent().click()
            cheat_visitor(visitor_num)
            back()
        }
        sleep(5000)
        boundsInside(0,device.height*0.7,device.width,device.height).text("消息").findOne().parent().parent().click()
        sleep(10000)
    }
}
function get_words()
{
    return words[random(0,words.length-1)]
}
//检查未读消息
function check_unread()
{
    let unread = id("txvUnread").find()
    log("未读消息数"+unread.length)
    for(let i=0;i<unread.length;i++)
    {
        name = unread[i].parent().child(1).text()
        //log(name)
        if(black_list.indexOf(name)==-1)
        {
            log("客户--"+name+"发来消息,准备回复")
            unread[i].parent().click()
            sleep(2000);
            let words = get_words()
            var strArray=words.split("")
            var char=""
            for(var i=0;i<strArray.length;i++){
              var char=char+strArray[i]
              id("etInputContent").findOne().setText(char)
              sleep(random(350,450))
            }
            text("发送").findOne().parent().click()
            console.info("完成一次自动回复")
            back();
            black_list.push(name)
            return;
        }
    }
}
//判断是否为用户
function is_customer()
{
        while(!id("username").exists())
    {
        sleep(1000)
    }
    log(id("username").findOne().getText()+"--判断是否存在技能")
    if(text("技能").exists())
    {
        log("存在技能,放弃")
        return false;
    }
    log("找寻判断性别控件")
    console.hide()
    sleep(100)
    var bounds = id("gender_view").findOne().bounds()
    // log("top:"+bounds.top+"left:"+bounds.left+"\n"+"right"+bounds.right+"bottom"+bounds.bottom)
    var  img = images.captureScreen();
    // img = images.clip(img,bounds.left,bounds.top,hbounds.width(),bounds.height())
    // images.save(img,"/sdcard/1.jpg")
    var point = findColor(img, "#39BEFF", {
        threshold: 20,
        region:[bounds.left,bounds.top,bounds.width(),bounds.height()]
    });
    console.show();
    if(point){
        log("判断"+id("username").findOne().getText()+"为男")
        return "男";
    }else{
        log("判断"+id("username").findOne().getText()+"为女")
        return "女";
    }
}
//返回多少访客
function check_visitor_num()
{
    // log("check_visiter")
    // t  = boundsInside(0, 100, device.width, device.height/2).id("badge_view").find()
    // toast(id("badge_view").exists())
    // for(i=0;i<t.length;i++)
    // {
    //     log("x"+t[i].bounds().cnterX()+",y:"+t[i].bounds().centerY())
    // }
    let par_tar = text("访客").findOne().parent().children()
    for(i=0;i<par_tar.length;i++)
    {
        if(par_tar[i].id()=="com.yitantech.gaigai:id/badge_view")
        {
            console.info("新增"+par_tar[i].child(0).text()+"个访客")
            return Number(par_tar[i].child(0).text())
        }
    }
    return 0
}
//点击浏览前n位主页并检查私聊
function cheat_visitor(target_num)
{

    let user_name_arr = new Array()
    while(user_name_arr.length<=target_num)
    {
        let visitor  = id("user_bg").untilFind();
        console.info("访客列表获取成功")
        // back();
        //log(user_name.length)
        for(let i=0;i<visitor.length;i++)
        {
            while(!id("user_bg").exists())sleep(500);
            user_name_arr.push(visitor[i].child(1).child(0).text())
            visitor[i].click()
            sleep(1000)
            let check_status = is_customer()
            if(check_status)
            {
                let nickname = id("username").findOne().text()
                console.warn("准备上传:"+nickname)
                let data = {"nickname":nickname,"gender":check_status,"belong_key":belong_key}
                updateInfo(data)
                console.info("上传服务器成功")
                sleep(1000)
                back()
                sleep(500)
               
            }else
            {       
                sleep(1000)
                back()
    
            } 
            if(user_name_arr.length>=target_num)
            {
                toast("完成")
                log("个数"+user_name_arr.length)
                back();
                return 0;
            }
        }
        let swipe_num=0;
        while(text(user_name_arr[user_name_arr.length-1]).exists())
        {
            swipe_num++;
            swipe(device.width*0.5,device.height*0.7,device.width*0.5,device.height*0.5,600)
            sleep(200)
            if(swipe_num>=30)
            {
                console.error("访客数量有限,未达目标任务数")
                return 0;
            }
        }
    }
    
}  
//上传信息
function updateInfo(dataInfo)
{
    try
    {
        let url = server_url+"/uploadInfo"
        let data=
                {
                    "belong_key":belong_key,
                    "nickname":dataInfo["nickname"],
                    "gender":dataInfo["gender"]
                }
        let sign = create_sign(data)
        let res = http.postJson(url,{
            "data":data,
            "sign":sign
        })
    }catch(e)
    {
        return false
    }

    // log("服务器传来消息:"+res.body.string())
}
//获取加密后的sign
function getSign(dataInfo)
{
    try
    {
        let url = server_url+"/getMd5"
        let data=
                {
                    "belong_key":belong_key,
                    "nickname":dataInfo["nickname"],
                    "gender":dataInfo["gender"]
                }
        let sign = http.postJson(url=url,data=data)
        let res = sign.body.string()
        return res
    }catch(e)
    {
        return false;
    }

}
//对sign进一步处理得到最终sign
function create_sign(data)
{
    let res = getSign(data)
    if(res)
    {
        let sign = res
        sign = sign.replace(new RegExp('a',"gm"),'c')
        sign = sign.replace(new RegExp('6',"gm"),'4')
        sign = sign.replace(new RegExp('f',"gm"),'z')
        sign = sign.replace(new RegExp('1',"gm"),'3')
        sign = sign.replace(new RegExp('5',"gm"),'7')
        sign = sign.replace(new RegExp('8',"gm"),'9') 
        return sign
    }else
    {
        return false
    }

}