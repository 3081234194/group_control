console.show();
console.setPosition(0,device.height-1000);
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
/*************************传入参数区**************************** */
var args = engines.myEngine().execArgv;
var uuid = String(args.room_uuid)
var chat_target_num = Number(args.chat_target_num)
var chat_sleep_time = Number(args.chat_sleep_time)
var send_emoji_flag = args.send_emoji_flag;
var filter_gender = Number(args.gender);//是否筛选段位
var filter_game = args.filter_game//是否筛选游戏
var filter_game_games = String(args.filter_game_games).split("|")
var server_url = "http://120.79.0.9:6050"
/************************************************************** */
if(filter_game==true)
{
    var game_list = [];
    for(i=0;i<filter_game_games.length;i++)
    {
        game_list.push(filter_game_games[i])
    }
}else
{
    var game_list = "";
}
if(filter_gender==true)
{
    if(gender_choose==0)
    {
        var gender = "男"
    }else
    {
        var gender = "女"
    }
}else
{
    var gender = ""
}
app.launchApp("比心陪练")
sleep(8000)
if(chat_target_num>0)
{
    for(let j=0;j<chat_target_num;j++)
    {
        main()
    }
}else
{
    while(true)
    {
        main()
    }
}
function main()
{
    let name = get_name()
    console.info("获取到昵称:"+name)
    sleep(1000)
    search(name)
    chat()
    log("下一轮")
    sleep_pro()
}


//处于主页的情况下搜索,传参为搜索名字
function search(name)
{
    id("timeline_text_search").findOne().click()
    id("editText").findOne().click()
    sleep(1500)
    var str= name
    var strArray=str.split("")
    var char=""
    for(var i=0;i<strArray.length;i++){
      var char=char+strArray[i]
      id("editText").findOne().setText(char)
      sleep(random(350,450))
    }
    sleep(1000)
    text("搜索").findOne().parent().parent().parent().click()
    sleep(2000)
    id("bx_avatar_view_id").findOne().parent().parent().click()
    sleep(500)
    text("聊天").findOne().click()

}
function get_words()
{
    file = open("/sdcard/words.txt")
    comments = file.readlines()
    return comments[random(0,comments.length-1)]
}
function chat()
{
    sleep(3000)
    while(!id("uf_txv_title").exists())sleep(1000)
    if(!id("txvMsgContent").exists())
    {
            sendEmoji()
    }else
    {
        log("已发送过私聊,退出该私聊")
    }

    sleep(1000)
    back();
    sleep(500)
    back()
    sleep(500)
    back()
}

function get_name()
{
    let url = server_url+"/room/query"
    let data = 
    {
        "uuid":uuid,
        "game_filter":game_list,
        "gender_filter":gender

    }
    let res = http.postJson(url=url,data=data)
    res = res.body.json()
    if(res["code"]==0)
    {
        return res["data"]["nickname"]
    }else
    {
        alert("请求异常,服务器传来消息:"+res["msg"])
        toast("脚本退出")
        console.hide()
        exit()
    }
}
//toast提示秒数,随机延时
function sleep_pro()
{
    let mini_num = chat_sleep_time
    let max_num = chat_sleep_time+random(2,6)
    log("智能拟人停顿中")
    let sleep_time = random(mini_num,max_num)
    for(let i=0;i<sleep_time;i=i+2)
    {
        sleep(2000)
        toast("还有"+(sleep_time-i)+"秒")
    }
    log("执行下一步动作")
}
//发送表情
function sendEmoji()
{
    toast("start")
    id("iftEmoji").findOne().click()
    sleep(1000)
    id("iftDelete").findOne().parent().child(0).child(0).child(1).click()
    sleep(1000)
    var emoji = id("sticker_thumb_image").filter(filter_on).find()
    sleep(1000)
    emoji[random(1,emoji.length-1)].parent().parent().click()
    toast("ok")
    sleep(2000)
    //过滤表情依赖
    function filter_on(currentValue)
    {
    
            if(currentValue.parent().childCount()==1)
            {
                return true;
            }else
            {
                return false;
            }
    
    }
}