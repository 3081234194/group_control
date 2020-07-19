"ui";
var storage = storages.create("config")

ui.layout(
<vertical>
<vertical>
    <appbar>
        <toolbar title="诗雨工作室拓展功能单版"/>
    </appbar>
    <Switch id="autoService" text="无障碍服务" checked="{{auto.service != null}}" padding="8 8 8 8" textSize="15sp"/>
    <frame h="*" gravity="center">
        <vertical>
        <input hint="卡密" layout_gravity="center" id="secret_code" w="*"/>
        <horizontal>
                <text textSize="16sp" textColor="black" text="挂机自动回复:"/>
                <input id="reply_words" w="*" singleLine="true" hint="自动回复的话"/>
        </horizontal>
        <horizontal>
                <text textSize="16sp" textColor="black" text="选择私聊来访对象的性别"/>
                <spinner id="gender_choose" entries="男|女"/>
        </horizontal>
        <text text="挂机自动回复中还会检查是否有访客,有访客会筛选并进行私聊"/>
        <input id="words" hint="你好|再见|不见" w="*" h="100sp"/>
        <text text="每句话用'|'隔开,不要回车,运行前一定要设置语库" color="red"/>
        <text text="设置好后点击保存,语库保存在/sdcard/words.txt" color="red"/>
        <horizontal gravity="center">
        <button id="save_words" text="#保存话术#"/>
        <button id="save_config" text="保存配置"/>
        <button id="open_words" text="打开文件"/>
        </horizontal>
        <button layout_gravity="bottom" w="*" h="auto" text="开始运行" id="start"/>
        </vertical>
    </frame>
   </vertical>
</vertical>)
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
function loadConfig()
{
    ui["secret_code"].setText(storage.get("secret_code",""))
    ui["reply_words"].setText(storage.get("reply_words",""))
    ui.gender_choose.setSelection(storage.get("gender_choose",0));
    ui["words"].setText(storage.get("words",""))
}
function saveConfig()
{
    storage.put("secret_code",ui.secret_key.getText()+"")
    storage.put("reply_words",ui.reply_words.getText()+"")
    storage.put("gender_choose",ui.gender_choose.getSelectedItemPosition())
    storage.put("words",ui.words.getText()+"");

}
// 当用户回到本界面时，resume事件会被触发
ui.emitter.on("resume", function() {
    // 此时根据无障碍服务的开启情况，同步开关的状态
    ui.autoService.checked = auto.service != null;
});

ui.start.on("click", function(){
    //程序开始运行之前判断无障碍服务
    if(auto.service == null) {
        toast("请先开启无障碍服务！");
        return;
    }
        ui.start.setEnabled(false);
    setTimeout(()=>{
        ui.start.setEnabled(true);
    },3000)
    taskScript = engines.execScriptFile('auto_task.js',{
        arguments:
        {
            secret_code:ui.secret_code.getText(),
            reply_words:ui.reply_words.getText(),
            gender_choose:ui.gender_choose.getSelectedItemPosition(),
            words:ui.words.getText()
        }
    })
});