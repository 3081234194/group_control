var uuid="c69bb0cb-a30d-4fae-afad-fe838c10d6a2"
var server_url = "http://120.79.0.9:6050"
function main()
{
    text("首页").findOne().parent().parent().click()
    sleep(1000)
    let name = get_info()
    search(name)
    chat()
}
function get_info()
{
    let url = server_url+"/room/query"
    let data = 
    {
        "uuid":uuid,
        "game_filter":"",
        "gender_filter":""

    }
    let res = http.postJson(url=url,data=data)
    res = res.body.json()
    if(res["code"]==0)
    {
        return res["nickname"]
    }else
    {
        alert("请求异常,服务器传来消息:"+res["msg"])
        toast("脚本退出")
        exit()
    }
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
//进入私聊界面
function chat()
{
    sleep(3000)
    while(!id("uf_txv_title").exists())sleep(1000)
    if(!id("txvMsgContent").exists())
    {
        id("etInputContent").findOne().setText(get_words())
        var str= get_words()
        var strArray=str.split("")
        var char=""
        for(var i=0;i<strArray.length;i++){
          var char=char+strArray[i]
          id("etInputContent").findOne().setText(char)
          sleep(random(200,400))
        }
        sleep(1000)
        text("发送").findOne().parent().click()
        if(send_emoji_flag==true)
        {
            sendEmoji()
        }
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