var black_list = ["互动消息","订单消息","系统通知","订阅消息"]
var args = engines.myEngine().execArgv;
var  reply_words = args.reply_words;
var secret_code = args.secret_code;
var gender_choose = args.gender_choose
var words = String(args.words)
var server_url = ""//服务器地址
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
        log("判断"+id("name").findOne().getText()+"为男")
        return "男";
    }else{
        log("判断"+id("name").findOne().getText()+"为女")
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
function cheat_visitor(num)
{
    let visitor = id("user_bg").untilFind()
    for(let i=0;i<num;i++)
    {
        visitor[i].click()
        let check_status = is_customer()
        if(check_status)
        {
            let data = {"nickname":id("name").findOne().getText(),"gender":check_status,"belong_key":belong_key}
            updateInfo(data)
            log("正在绕过风控中")
            sleep(random(4000,5500))
            if((gender_choose==0&&check_status=="男")||(gender_choose==1&&check_status=="女"))
            {
                text("聊天").findOne().click()
                var str= get_words()
                var strArray=str.split("")
                var char=""
                for(var i=0;i<strArray.length;i++)
                {
                  var char=char+strArray[i]
                  id("etInputContent").findOne().setText(char)
                  sleep(random(200,400))
                }
                text("发送").findOne().parent().click()
                sleep(1000)
                back()
                sleep(500)
            }
           
        }
        sleep(1000)
        back()
        sleep(1000)
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
        sign = sign.replace('a','c')
        sign = sign.replace('6','8')
        sign = sign.replace('f','z')
        sign = sign.replace('e','a')
        sign = sign.replace('3','6')
        sign = sign.replace('8','6')
        return sign
    }else
    {
        return false
    }

}