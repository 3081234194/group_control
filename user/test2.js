var server_url = "http://120.79.0.9:6050"//服务器地址
var belong_key = "0"
function updateInfo(dataInfo)
{
    try
    {
        let url = server_url+"/uploadInfo"
        let data=
                {
                    "nickname":dataInfo["nickname"],
                    "gender":dataInfo["gender"],
                    "belong_key":belong_key
                }
        let sign = create_sign(data)
        let res = http.postJson(url,{
            "data":data,
            "sign":sign
        })
        log(res.body.string())
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
                    
                    "nickname":dataInfo["nickname"],
                    "gender":dataInfo["gender"],
                    "belong_key":belong_key
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
        log("sign为"+sign)
        return sign
    }else
    {
        return false
    }

}
// var sign = "85fd73ed29e4c39bbfc71e510a68cc5c"
// sign = sign.replace('a','c')
// sign = sign.replace('6','8')
// sign = sign.replace('f','z')
// sign = sign.replace('3','6')
// sign = sign.replace('5','7')
// sign = sign.replace('8','9')
// log("sign为"+sign)
updateInfo({"nickname":"大憨","gender":"男","belong_key":"0"})
log("完成")
// 85fd73ed29e4c39bbfc71e510a68cc5c
// 97zd76ad29a4c69bbzc73a730c99cc7c
