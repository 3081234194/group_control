if(!images.requestScreenCapture())
{
    console.error("未获取截图权限,脚本退出")
    exit();
}
console.show()
var server_url = "http://120.79.0.9:6050"//服务器地址
var belong_key = "0"
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
     boundsInside(0,device.height*0.7,device.width,device.height).text("我的").findOne().parent().parent().click()
    log("检查访客中")
    let visitor_num = check_visitor_num()
    text("访客").findOne().parent().click()
    cheat_visitor(10)
    back()
    sleep(5000)
    alert("运行完成")
}
function get_words()
{
    return words[random(0,words.length-1)]
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
                let data = {"nickname":id("username").findOne().getText(),"gender":check_status,"belong_key":belong_key}
                updateInfo(data)
                console.info("上传服务器:"+data)
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
                for(let i=0;i<user_name_arr.length;i++)
                {
                    log(user_name_arr[i])
                }
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
    log(res.body.json())
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
main()