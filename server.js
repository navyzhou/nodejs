var express=require('express');
var cookieParser=require("cookie-parser");
var bodyParser=require("body-parser");
var session=require('express-session'); //session模块
var mysql=require("mysql"); //数据库模块
var fs=require('fs'); //文件操作
var multer=require('multer'); //这是一个Node.js的中间件处理multipart/form-data

var app=express(); //创建web应用程序
app.use(cookieParser()); //使用cookieParser()
app.use(bodyParser.urlencoded({extended: true}));
//app.use(express.static('user'));
var upload=multer({dest:'./user/photo'}); //上传图片默认保存路径

var pool=mysql.createPool({ //数据连接池
    host:'127.0.0.1',
    port:3306,
    database:'test',
    user:'root',
    password:'a'
});

app.all("/user/back*",function(req,res,next){
    console.info(req);
    if(session.currentUser==undefined){
        res.send("<script>alert('请先登录...');location.href='/user/login.html';</script>");
        //res.sendFile(__dirname+"/login.html");
    }else{
        next();
    }
});

//用户登录
app.post("/user/userLogin",function(req,res){
    var flag="0";
    if(req.body.uname==""){
        res.send("1"); //必须是一个字符串或者对象; //用户名为空
        res.end();
    }else if(req.body.pwd==""){
        res.send("2");//密码为空
        res.end();
    }else {
        pool.getConnection(function (err, connection) {
            if (err) {
                res.send("3"); //数据库连接失败
                res.end();
            } else {
                connection.query("select * from userInfo where uname=? and pwd=?",[req.body.uname, req.body.pwd], function (err, result) {
                        if (err) {
                            console.info(err);
                            res.send("4"); //用户名或密码错误
                        } else {
                            if (result.length > 0) { //说明登陆成功
                                //将当前登录用户存到session中
                                res.send("5");
                                console.info(result.length);
                                session.currentUser = result[0];
                            } else {
                                res.send("4");  //用户名或密码错误
                            }
                            connection.release(); //释放连接，还给连接池

                        }
                        res.end();
                    });
            }
        });
    }
});

//获取所有数据
app.post("/user/back/showUserInfo",function(req,res){
    pool.getConnection(function(err,connection){
        if(err){
            res.send("数据库连接失败...");
        }else{
            connection.query("select * from userinfo",null,function(err,result){
                connection.release();
                //res.header("Access-Control-Allow-Origin", "*");
                if(err){
                    res.send("数据查询失败...")
                }else{
                    res.send(result); //返回添加数据
                }
                res.end();
            });
        }
    });
});

app.post("/user/addUserInfo",upload.single("photo"),function(req,res,next){
    pool.getConnection(function(err,connection){
        if(err){
            res.send("0");
            res.end();
        }else{
            var filename="";
            if(req.file!=undefined){
                filename="/photo/" + req.file.originalname;
                var path = __dirname + "/user/photo/" + req.file.originalname;
                fs.renameSync(req.file.path,path);
            }
            connection.query("insert into userinfo set ?",{uname:req.body.uname,pwd:req.body.pwd,photo:filename},function(err,result){
                connection.release();
                //res.header("Access-Control-Allow-Origin", "*");
                //res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
                //res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
                if(err){
                    res.send("0");
                }else {
                    res.send("1");
                }
                res.end();
            });
        }
    });
});

//获取user下面的静态文件
app.get("/user/*",function(req,res){
    res.sendFile(__dirname+req.url);
});

app.listen(6666);