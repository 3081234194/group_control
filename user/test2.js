

var columns = [{
    "data": "name",
    "title": "张三"
}]

function toUnicode (arr){
    
    var strArr=[];
    for(var i = 0;i<arr.length;i++){
        strArr.push(arr[i].title);
    }
    var str = strArr.join(',');    
    function isChinese(s){
    return /[\u4e00-\u9fa5]/.test(s);
    }    
    function ch2Unicdoe(str){
        if(!str){
            return;
        }
        var unicode = '';
        for (var i = 0; i <  str.length; i++) {
        var temp = str.charAt(i);
        if(isChinese(temp)){
            unicode += '\\u' +  temp.charCodeAt(0).toString(16);
        }
        else{
            unicode += temp;
        }
        }
        return unicode;
    }    
    var aa = ch2Unicdoe(str); 
    var bb = aa.split(',')
    for(var i = 0;i<arr.length;i++){
    for(var j=0;j<bb.length;j++){
    arr[i].title = bb[i];
    }
    }
    return arr;
}
function getMd5(string) {return java.math.BigInteger(1, java.security.MessageDigest.getInstance("MD5").digest(java.lang.String(string).getBytes())).toString(16)}
log(getMd5(toUnicode(columns)[0]))