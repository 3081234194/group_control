

import json
import hashlib
from flask import Flask,request
import pymysql
conn = pymysql.connect(host='127.0.0.1', port=3306, user='root', passwd='q2251682', db='bixin', charset='utf8')
app = Flask(__name__)
@app.route("/uploadInfo", methods=["POST"])
def receiveInfo():
    if request.method == 'POST':
        receive_data = request.get_data()
        receive_json = json.loads(receive_data)
        if checkSign(receive_json["data"],receive_json["sign"])!=0:
            insert_result = insertData(receive_json["data"])
            if insert_result!=0:
                return {"code":100,"msg":str(insert_result)}
            else:
                return {"code":0,"msg":"SUCCESS"}
        else:
            return "非法请求"
    else:
        return '<h1>只接受post请求！</h1>'
#对sign进行检验
def checkSign(data,sign):
    md5_data = md5(data)
    local_sign = algorithmSign(md5_data)az406496b6bz40a0d0z4a7a66z096529
    if local_sign==sign:
        return 0
    else:
        return local_sign
#对传入md5加密
def md5(string):
    strings = hashlib.md5()
    strings.update(str(string).encode("utf8"))
    return strings.hexdigest()
#sign的进一步算法
def algorithmSign(sign):
    sign = sign.replace('a','c')
    sign = sign.replace('6','8')
    sign = sign.replace('f','z')
    sign = sign.replace('e','a')
    sign = sign.replace('3','6')
    sign = sign.replace('1','3')
    sign = sign.replace('5','7')
    sign = sign.replace('8','9')
    return sign
#向数据库插入接收到的信息
def insertData(data):
    try:
        ###############插入前先检查数据库是否存在################
        cursor = conn.cursor(cursor=pymysql.cursors.DictCursor)
        cursor.execute("select nickname from id_info where nickname='%s'and belong_key='%s'" %(data["nickname"],data["belong_key"]))
        query_nickname = cursor.fetchone()
        cursor.close()
        ########################################################
        if query_nickname:   
            return "目标已存在"
        else:
            cursor = conn.cursor()#创建游标
            cursor.execute("INSERT INTO id_info (nickname,gender,belong_key,insert_time) values ('%s','%s','%s',NOW())" %(data["nickname"],data["gender"],data["belong_key"]))
            conn.commit()
    except Exception as err:
        return err
    finally:
        cursor.close()
    print("插入成功")
    return 0
@app.route("/getMd5", methods=["POST"])
def getMD5():
     if request.method == 'POST':
        receive_data = request.get_data()
        receive_json = json.loads(receive_data)
        return md5(receive_json)
app.run(debug=True,host="0.0.0.0",port="6050")