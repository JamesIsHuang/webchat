var express = require('express');
var router = express.Router();
var mongoose = require('mongoose');
/* GET index page. */
router.get('/', function(req, res,next) {
  res.render('index', { title: 'chat' });    // 到达此路径则渲染index文件，并传出title值供 index.html使用
});
var userSchema = new mongoose.Schema({
      count:{type: Number, default: 3},
    },
    {collection: "count"}
);
var dbcount = mongoose.model('count', userSchema);
var usercount = 0,
    limituser = 0;


/* GET login page. */
router.route("/login").get(function(req,res){    // 到达此路径则渲染login文件，并传出title值供 login.html使用
  res.render("login",{title:'User Login'});
}).post(function(req,res){ 					   // 从此路径检测到post方式则进行post数据的处理操作
  //get User info
  //这里的User就是从model中获取user对象，通过global.dbHandel全局方法（这个方法在app.js中已经实现)
  var User = global.dbHandel.getModel('user');
  var uname = req.body.uname;				//获取post上来的 data数据中 uname的值
  dbcount.findOne({},function(err,doc){
    limituser = doc.count;
    console.log(limituser);
  })
  User.findOne({name:uname},function(err,doc){   //通过此model以用户名的条件 查询数据库中的匹配信息
    if(err){ 										//错误就返回给原post处（login.html) 状态码为500的错误
      res.send(500);
    }else if(!doc){ 								//查询不到用户名匹配信息，则用户名不存在
      if(uname == "visit"){
        req.session.user = true;
        res.json({name:"游客"});
      }else{
        req.session.error = '用户名不存在';
        res.send(404);
      }
     							//	状态码返回404
      //	res.redirect("/login");
    }else{
      if(req.body.upwd != doc.password){ 	//查询到匹配用户名的信息，但相应的password属性不匹配
        req.session.error = "密码错误";
        res.send(404);
        //	res.redirect("/login");
      }else if(req.session.user){
        req.session.user = null;
        req.session.error = null;
        req.session.admin = null;
        req.session.user = doc;
        req.session.admin = doc.IsAdmin;
        usercount = usercount;
        res.json({id:doc._id,name:doc.name});
      }else if(limituser === usercount){
        req.session.error = "聊天室人数已满";
        res.send(404);
      }else{ 									//信息匹配成功，则将此对象（匹配到的user) 赋给session.user  并返回成功
        req.session.user = doc;
        req.session.admin = doc.IsAdmin;
        usercount = usercount + 1;
        console.log(usercount);
        console.log(limituser);
        res.json({id:doc._id,name:doc.name});
        //res.send(200);
      }
    }
  });
});

/* GET register page. */
router.route("/register").get(function(req,res){    // 到达此路径则渲染register文件，并传出title值供 register.html使用
  res.render("register",{title:'User register'});
}).post(function(req,res){
  //这里的User就是从model中获取user对象，通过global.dbHandel全局方法（这个方法在app.js中已经实现)
  var User = global.dbHandel.getModel('user');
  var uname = req.body.uname;
  var upwd = req.body.upwd;
  User.findOne({name: uname},function(err,doc){   // 同理 /login 路径的处理方式
    if(err){
      res.send(500);
      req.session.error =  '网络异常错误！';
      console.log(err);
    }else if(doc){
      req.session.error = '用户名已存在！';
      res.send(500);
    }else{
      User.create({ 							// 创建一组user对象置入model
        name: uname,
        password: upwd,
        IsAdmin:false,
        forbid:false,
      },function(err,doc){
        if (err) {
          res.send(500);
          console.log(err);
        } else {
          req.session.error = '用户名创建成功！';
          res.send(200);
        }
      });
    }
  });
});
//渲染忘记密码页面
router.route("/forget").get(function(req,res){    // 到达此路径则渲染login文件，并传出title值供 login.html使用
  res.render("forget",{title:'User forget'});
})
//修改密码
router.route("/forget").post(function(req,res){    // 到达此路径则渲染login文件，并传出title值供 login.html使用
  var User = global.dbHandel.getModel('user');
  var uname = req.body.uname,
      upwd = req.body.upwd,
      npwd = req.body.npwd;
  User.findOne({name:uname,password:upwd},function(err,doc){
    if(err){
      req.session.error =  '网络异常错误！';
      res.send(500);
      console.log(err);
    }else if(!doc){
      req.session.error =  '用户名或密码错误';
      res.send(404);
    }else{
      User.update({name:uname},{$set:{password:npwd}},function(err,doc){
        if (err) {
          req.session.error = '密码修改失败!';
          res.send(500);
        } else {
          req.session.error = '密码修改成功!';
          res.send(200);
        }
      })
    }
  })
})
/* GET home page. */
router.get("/home",function(req,res){
  if(!req.session.user){ 					//到达/home路径首先判断是否已经登录
    req.session.error = "请先登录"
    res.redirect("/login");				//未登录则重定向到 /login 路径
  }
  res.render("home",{title:'Home'});         //已登录则渲染home页面
});
/* GET admin page. */
router.get("/admin",function(req,res){
  if(!req.session.admin){
    req.session.error = "请先登录";
    res.redirect("/login");
  }
  var User = global.dbHandel.getModel('user');
  var data1 = null;
  User.find({}).sort({'IsAdmin':-1}).exec(function(err,data){
    data1 = data;
    res.render("admin",{title:'admin',data:data1});
  })
})
router.get('/judgeadmin',function(req,res){
  res.json({'admin':req.session.admin});
})
//删除
router.delete('/admin',function(req,res){
    var User = global.dbHandel.getModel('user');
    var id = req.body.id;
    User.remove({_id:id},function(err,doc){
      if(err){
        res.send(500);
      }else if(!doc){
        res.send(404);
      }else{
        res.send(200);
      }
    })
})
//管理员修改密码
router.post('/admin',function(req,res){
    var User = global.dbHandel.getModel('user'),
        id = req.body.id,
        password = req.body.password;
    User.update({_id:id},{$set:{password:password}},function(err,doc){
        if(err){
          res.send(500);
        }else if(!doc){
          res.send(404);
        }else{
          req.session.error = '密码修改成功';
          res.send(200);
        }
    })
})
//设为管理员
router.post('/isadmin',function(req,res){
    var User = global.dbHandel.getModel('user'),
        id = req.body.id,
        isAdmin = req.body.IsAdmin;
    User.update({_id:id},{$set:{IsAdmin:isAdmin}},function(err,doc){
      if(err){
        res.send(500);
      }else if(!doc){
        res.send(404);
      }else{
        req.session.error = "设置成功";
        res.send(200);
      }
    })
})
//设置禁言
router.put('/admin',function(req,res){
  var User = global.dbHandel.getModel('user'),
      id = req.body.id,
      forbid = req.body.forbid;
  User.update({_id:id},{$set:{forbid:forbid}},function(err,doc){
    if(err){
      res.send(500);
    }else if(!doc){
      res.send(404);
    }else{
      req.session.error = "设置禁言成功";
      res.send(200);
    }
  })
})
//查询是否禁言以及是否被删除
router.post('/forbid',function(req,res){
  var User = global.dbHandel.getModel('user'),
      id = req.body.id,
      forbid;
  User.findOne({_id:id},function(err,doc){
    if(err){
      res.send(500);
    }else if(!doc){
      res.json({isDelete:true});
    }else{
      res.json({forbid:doc.forbid,isDelete:false});
    }
  })
})
//聊天室人数接口
router.get('/limit',function(req,res){
  dbcount.findOne({},function(err,doc){
    if(err){
      res.send(500);
    }else if(!doc){
      res.send(404);
    }else{
      res.json({count:doc.count});
    }
  })
})
//设置聊天室人数
router.post('/setlimit',function(req,res){
  var count = req.body.count;
  dbcount.update({$set:{count:count}},function(err,doc){
    if(err){
      res.send(500);
    }else if(!doc){
      res.send(404);
    }else{
      req.session.error = "设置成功";
      res.send(200);
    }
  })
})
/* GET logout page. */
router.get("/logout",function(req,res){    // 到达 /logout 路径则登出， session中user,error对象置空，并重定向到根路径
  req.session.user = null;
  req.session.error = null;
  req.session.admin = null;
  usercount = usercount - 1;
  console.log(usercount);
  if(usercount<0){
    usercount = 0;
  }
  res.redirect("/");
});

module.exports = router;