"ui";
var storage = storages.create("config");
ui.layout(
<frame>
<vertical>
<Switch id="autoService" gravity="top" text="无障碍服务" checked="{{auto.service != null}}" padding="8 8 8 8" textSize="15sp"/>
    <ScrollView>
        <vertical>
            <horizontal>
                <text textSize="16sp" textColor="black" text="工作室获取数据key:" />
                <input id="room_uuid" w="*" singleLine="true"/>
            </horizontal>    
            <horizontal>
                <text textSize="16sp" textColor="black" text="私聊养号次数(0为不限制):" />
                <input id="chat_target_num" w="48sp"/>
            </horizontal>
            <horizontal>
                <text textSize="16sp" textColor="black" text="私聊间隔时间:" />
                <input id="chat_sleep_time" w="48sp"/>
                <Switch id="send_emoji" text="私聊带表情包"textSize="15sp"/>
            </horizontal>
            <Switch id="filter_gender" gravity="top" text="性别筛选"padding="8 8 8 8" color="#00BFFF"/>
            <vertical id="filter_gender_list">
                <horizontal  gravity="center">
                    <text text="对性别进行筛选"/>
                    <spinner id="gender_choose" entries="男|女"/>
                </horizontal> 
            </vertical>
            <Switch id="filter_game" gravity="top" text="游戏筛选"padding="8 8 8 8"color="#00BFFF"/>
            <vertical id="filter_game_list">
            <horizontal>
                <text text="游戏筛选:"/>
                <input id="filter_game_games" hint="王者荣耀|和平精英|奇迹暖暖" singleLine="true"/>
            </horizontal>
            </vertical>
            <input id="words" hint="一句话术一行" w="*" h="100sp"/>
            <text text="一句话术一行,运行前一定要设置语库" color="red"/>
            <text text="设置好后点击保存,语库保存在/sdcard/words.txt" color="red"/>
            <horizontal gravity="center">
            <button id="save_words" text="#保存话术#"/>
            <button id="save_config" text="保存配置"/>
            <button id="open_words" text="打开文件"/>
            </horizontal>
            <button id="cheat_emotion" text="只私聊表情"/>
            <button layout_gravity="bottom" w="*" h="auto" text="开始运行(私聊引流)" id="start"/>
        </vertical>
    </ScrollView>
    </vertical>
</frame>
)
loadConfig()
if(ui.filter_gender.isChecked()==true)
{
  ui.filter_gender_list.visibility = 0;
}else
{
  ui.filter_gender_list.visibility = 8;
}
if(ui.filter_game.isChecked()==true)
{
  ui.filter_game_list.visibility = 0;
}else
{
  ui.filter_game_list.visibility = 8;
}
ui.autoService.on("check", function(checked) {
    // 用户勾选无障碍服务的选项时，跳转到页面让用户去开启
    if(checked && auto.service == null) {
        app.startActivity({
            action: "android.settings.ACCESSIBILITY_SETTINGS"
        });
    }
    if(!checked && auto.service != null){
        auto.service.disableSelf();
    }
});
// 当用户回到本界面时，resume事件会被触发
ui.emitter.on("resume", function() {
    // 此时根据无障碍服务的开启情况，同步开关的状态
    ui.autoService.checked = auto.service != null;
});
ui.filter_gender.on("click",function()
{
  if(ui.filter_gender.isChecked()==true)
  {
    ui.filter_gender_list.visibility = 0;
  }else
  {
    ui.filter_gender_list.visibility = 8;
  }
})
ui.filter_game.on("click",function()
{
  if(ui.filter_game.isChecked()==true)
  {
    ui.filter_game_list.visibility = 0;
  }else
  {
    ui.filter_game_list.visibility = 8;
  }
})
ui.save_words.on("click",function()
{
    files.createWithDirs("/sdcard/words.txt");
    let words = ui.words.getText();
    files.write("/sdcard/words.txt",words);
    toast("保存成功")
})
ui.save_config.on("click",function()
{
    saveConfig()
    toast("保存成功")
})
ui.start.on("click",function()
{
    if(checked && auto.service == null)
    {
        toast("请先开启无障碍模式")
        return;
    }
    saveConfig()
    ui.start.setEnabled(false);
    setTimeout(()=>{
        ui.start.setEnabled(true);
    },3000)
    taskScript = engines.execScriptFile('cheat.js',{
        arguments:{
            room_uuid:ui.room_uuid.getText(),
            chat_target_num:ui.chat_target_num.getText(),
            chat_sleep_time:ui.chat_sleep_time.getText(),
            send_emoji_flag:ui.send_emoji.isChecked(),
            filter_gender:ui.filter_gender.isChecked(),
            gender_choose:ui.gender_choose.getSelectedItemPosition(),
            filter_game:ui.filter_game.isChecked(),
            filter_game_games:ui.filter_game_games.getText()
        }
      })

})
ui.cheat_emotion.on("click",function(){
    ui.cheat_emotion.setEnabled(false);
    setTimeout(()=>{
        ui.cheat_emotion.setEnabled(true);
    },3000)
    taskScript = engines.execScriptFile('私聊表情.js',{
        arguments:{
            room_uuid:ui.room_uuid.getText(),
            chat_target_num:ui.chat_target_num.getText(),
            chat_sleep_time:ui.chat_sleep_time.getText(),
            send_emoji_flag:ui.send_emoji.isChecked(),
            filter_gender:ui.filter_gender.isChecked(),
            gender_choose:ui.gender_choose.getSelectedItemPosition(),
            filter_game:ui.filter_game.isChecked(),
            filter_game_games:ui.filter_game_games.getText()
        }
      })
})
//加载配置
function loadConfig()
{
    ui["room_uuid"].setText(storage.get("room_uuid",""))
    ui["chat_target_num"].setText(storage.get("chat_target_num","80"))
    ui["chat_sleep_time"].setText(storage.get("chat_sleep_time","65"))
    ui.send_emoji.checked = storage.get("send_emoji_flag",false)
    ui.filter_gender.checked = storage.get("filter_gender",true)
    //ui.gender_choose.setSelectedItemPosition(storage.get("gender_choose"))
    ui.filter_game.checked = storage.get("filter_game",false)
    ui.filter_game_games.setText(storage.get("filter_game_games",""))
    ui["words"].setText(storage.get("words",""))
}
function saveConfig()
{
    storage.put("room_uuid",ui.room_uuid.getText()+"")
    storage.put("chat_target_num",ui.chat_target_num.getText()+"")
    storage.put("chat_sleep_time",ui.chat_sleep_time.getText()+"")
    storage.put("send_emoji",ui.send_emoji.isChecked())
    storage.put("filter_gender",ui.filter_gender.isChecked())
    storage.put("gender_choose",ui.gender_choose.getSelectedItemPosition())
    storage.put("filter_game",ui.filter_game.isChecked())
    storage.put("filter_game_games",ui.filter_game_games.getText()+"")
    storage.put("words",ui.words.getText()+"")
}