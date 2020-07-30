

import json
import hashlib
from flask import Flask,request
from flask_sqlalchemy import SQLAlchemy
from os import urandom#随机
import datetime
from time import sleep
app = Flask(__name__)
app.config.from_object("sql_config")
app.secret_key = urandom(16)
db = SQLAlchemy(app)
################ORM####################
#工作室比心用户表
class room_id_info(db.Model):
    id = db.Column(db.Integer,primary_key=True)
    nickname = db.Column(db.String(30))
    gender = db.Column(db.String(1))
    game = db.Column(db.String(20))
    insert_time = db.Column(db.DateTime)
    use_times = db.Column(db.Integer)
    belong_key = db.Column(db.String(50))
#工作室权限获取数据用户
class room_admin_key(db.Model):
    id = db.Column(db.Integer,primary_key=True)
    uuid = db.Column(db.String(50))
    belong_key = db.Column(db.String(50))
#权限获取数据
class admin_key(db.Model):
    id = db.Column(db.Integer,primary_key=True)
    uuid = db.Column(db.String(50))
    belong_key = db.Column(db.String(50))
#散户收集到的数据
class id_info(db.Model):
    id = db.Column(db.Integer,primary_key=True)
    nickname = db.Column(db.String(30))
    gender = db.Column(db.String(1))
    insert_time = db.Column(db.DateTime)
    belong_key = db.Column(db.String(30))
def create_db():
    #重置化数据库
    db.create_all()
#######################################
@app.route("/uploadInfo", methods=["POST"])
def receiveInfo():
    if request.method == 'POST':
        receive_data = request.get_data()
        receive_json = json.loads(receive_data)
        if checkSign(receive_json["data"],receive_json["sign"])==0:
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
    local_sign = algorithmSign(md5_data)
    if local_sign==sign:
        print("sign检验成功")
        return 0
    else:
        print("正确sign为%s" %local_sign)
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
        query_nickname = db.session.query(id_info).filter(id_info.nickname==data["nickname"],id_info.belong_key==data["belong_key"]).first()
        ########################################################
        if query_nickname:   
            return "目标已存在"
        else:
            new_data = id_info(nickname=data["nickname"],gender=data["gender"],belong_key=data["belong_key"],insert_time=datetime.datetime.now())
            db.session.add(new_data)
            db.session.commit()
            print("插入成功")
            return 0
    except Exception as err:
        return err     
    
#插入工作室信息
def room_insertData(data):
    try:
        ###############插入前先检查数据库是否存在################
        query_uuid = db.session.query(room_admin_key).filter(room_admin_key.belong_key==data["belong_key"]).first()
        ########################################################
        if query_uuid:   
            query_nickname = db.session.query(room_id_info).filter(room_id_info.nickname==data["nickname"],room_id_info.belong_key==data["belong_key"]).first()
            if query_nickname:
                return "目标信息已存在"
            new_data = room_id_info(nickname=data["nickname"],gender=data["gender"],game=data["game"],use_times=0,belong_key=data["belong_key"],insert_time=datetime.datetime.now())
            db.session.add(new_data)
            db.session.commit()
        else:
            return "未授权工作室"
    except Exception as err:
        return err
    return 0
#生成md5
@app.route("/getMd5", methods=["POST"])
def getMD5():
     if request.method == 'POST':
        receive_data = request.get_data()
        receive_json = json.loads(receive_data)
        return md5(receive_json)
@app.route("/query/<uuid>", methods=["get"])
def out_data(uuid):
    try:
        query_key = db.session.query(admin_key).filter(admin_key.uuid==uuid).first()
        if query_key:
            local_belong_key = query_key.belong_key
            return "ok"
        else:
            return "无效key，拒绝访问"
    except Exception as err: 
        pass

@app.route("/room/query", methods=["post"])
def room_query():
    if request.method == 'POST':
        receive_data = request.get_data()
        receive_json = json.loads(receive_data)
        uuid = receive_json["uuid"]
        key = room_admin_check(uuid)
        if key:
            return room_query_data(key.belong_key,receive_json)
        else:
            return {"code":400,"msg":"无效key,禁止访问"}
    else:
        return {"code":500,"msg":"只接受post请求"}
@app.route("/room/uploadInfo", methods=["POST"])
def room_updateInfo():
    if request.method == 'POST':
        receive_data = request.get_data()
        receive_json = json.loads(receive_data)
        if checkSign(receive_json["data"],receive_json["sign"])==0:
            insert_result = room_insertData(receive_json["data"])
            if insert_result!=0:
                return {"code":100,"msg":str(insert_result)}
            else:
                return {"code":0,"msg":"SUCCESS"}
        else:
            return {"code":400,"msg":"非法请求"}
    else:
        return '<h1>只接受post请求！</h1>'
@app.route("/room/deleteAll", methods=["POST"])
def room_deleteAll():
    if request.method == 'POST':
        receive_data = request.get_data()
        receive_json = json.loads(receive_data)
        uuid = receive_json["uuid"]
        key = room_admin_check(uuid)
        if key:
            user = room_id_info.query.filter_by(belong_key=key.belong_key).delete(synchronize_session=False)
            db.session.commit()
            return {"code":0,"msg":"删除成功"}
        else:
            return {"code":400,"msg":"无效key,禁止访问"}
    else:
        return {"code":500,"msg":"只接受post请求"}
#查找工作室uuid对应的key
def room_admin_check(uuid):
    print("请求的uuid为%s" %uuid)
    query_key = db.session.query(room_admin_key).filter(room_admin_key.uuid==uuid).first()
    print("admin.key查询%s" %query_key)
    if(query_key):
        return query_key
    else:
        return False
#查找工作室id_info数据
def room_query_data(belong_key,data):
    if(data["gender_filter"] and data["game_filter"]):
        print("性别及技能都进行了筛选")
        query_data = db.session.query(room_id_info).filter(room_id_info.belong_key==belong_key,room_id_info.game.in_(data["game_filter"]),room_id_info.gender==data["gender_filter"]).order_by(room_id_info.insert_time).first()
    elif(data["gender_filter"]): 
        print("性别进行了筛选")
        query_data = db.session.query(room_id_info).filter(room_id_info.belong_key==belong_key,room_id_info.gender==data["gender_filter"]).order_by(room_id_info.insert_time).first()
    elif(data["game_filter"]):
         query_data = db.session.query(room_id_info).filter(room_id_info.belong_key==belong_key,room_id_info.game.in_(data["game_filter"])).order_by(room_id_info.insert_time).first()
    else:
        print("不筛选")
        query_data = db.session.query(room_id_info).filter(room_id_info.belong_key==belong_key).order_by(room_id_info.insert_time).first()
    if(query_data):
        db.session.delete(query_data)
        db.session.commit()
        return {"code":0,"msg":"SUCCESS","data":{"nickname":query_data.nickname,"gender":query_data.gender,"game":query_data.game,"insert_time":query_data.insert_time}}
    else:
        return {"code":-100,"msg":"无符合要求的用户或数据已跑完"}
create_db()
app.run(debug=True,host="0.0.0.0",port="6050")