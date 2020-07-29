function deleteData()
{
    let url = server_url+"/room/query"
    let data = 
    {
        "uuid":uuid
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