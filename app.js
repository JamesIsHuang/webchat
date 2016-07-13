var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var multer = require('multer');
var mongoose = require('mongoose');
var session = require('express-session');


var routes = require('./routes/index');
var users = require('./routes/users');

global.dbHandel = require('./database/dbHandel');
global.db = mongoose.connect("mongodb://localhost:27017/nodedb");
var http = require('http');
var app = express();
var server = http.Server(app);
var io = require('socket.io').listen(server);
app.use(session({
  secret: 'secret',
  cookie:{
    maxAge: 1000*60*30
  }
}));
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine("html",require("ejs").__express); // or   app.engine("html",require("ejs").renderFile);
//app.set("view engine","ejs");
app.set('view engine', 'html');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(multer());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req,res,next){
  res.locals.user = req.session.user;
  res.locals.admin = req.session.admin;
  var err = req.session.error;
  delete req.session.error;
  res.locals.message = "";
  if(err){
    res.locals.message = '<div class="alert alert-danger" style="margin-bottom:20px;color:red;">'+err+'</div>';
  }
  next();
});

app.use('/', routes);  // 即为为路径 / 设置路由
//app.use('/users', users); // 即为为路径 /users 设置路由
app.use('/login',routes); // 即为为路径 /login 设置路由
app.use('/register',routes); // 即为为路径 /register 设置路由
app.use('/home',routes);
app.use("/admin",routes);// 即为为路径 /admin 设置路由
app.use("/forget",routes);
app.use("/logout",routes); // 即为为路径 /logout 设置路由


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

//在线用户
var onlineUsers = {};
//当前在线人数
var onlineCount = 0;

io.on('connection', function(socket){
  console.log('a user connected');

  //监听新用户加入
  socket.on('login', function(obj){
    //将新加入用户的唯一标识当作socket的名称，后面退出的时候会用到
    socket.name = obj.userid;

    //检查在线列表，如果不在里面就加入
    if(!onlineUsers.hasOwnProperty(obj.userid)) {
      onlineUsers[obj.userid] = obj.username;
      //在线人数+1
      onlineCount++;
    }


    //向所有客户端广播用户加入
    io.emit('login', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj});
    console.log(obj.username+'加入了聊天室');
  });

  //监听用户退出
  socket.on('disconnect', function(){
    //将退出的用户从在线列表中删除
    if(onlineUsers.hasOwnProperty(socket.name)) {
      //退出用户的信息
      var obj = {userid:socket.name, username:onlineUsers[socket.name]};

      //删除
      delete onlineUsers[socket.name];
      //在线人数-1
      onlineCount--;

      //向所有客户端广播用户退出
      io.emit('logout', {onlineUsers:onlineUsers, onlineCount:onlineCount, user:obj});
      console.log(obj.username+'退出了聊天室');

    }
  });

  //监听用户发布聊天内容
  socket.on('message', function(obj){
    //向所有客户端广播发布的消息
    io.emit('message', obj);
    console.log(obj.username+'说：'+obj.content);
  });

});

app.set('port', process.env.PORT || 3000);

var server1 = server.listen(app.get('port'), function() {
  console.log('start at port:' + server.address().port);
});

module.exports = app;