(function () {
	var d = document,
	w = window,
	p = parseInt,
	dd = d.documentElement,
	db = d.body,
	dc = d.compatMode == 'CSS1Compat',
	dx = dc ? dd: db,
	ec = encodeURIComponent;
	
	w.CHAT = {
		msgObj:d.getElementById("message"),
		msgcontent: d.getElementById("messagecontent"),
		screenheight:w.innerHeight ? w.innerHeight : dx.clientHeight,
		username:null,
		userid:null,
		socket:null,
		//让浏览器滚动条保持在最低部
		scrollToBottom:function(){
			this.msgObj.scrollTop = this.msgObj.clientHeight;
		},
		//退出，本例只是一个简单的刷新
		logout:function(){
			//this.socket.disconnect();
			location.href = "/logout";
		},
		clearmessage:function(){
			d.getElementById('clearBtn').addEventListener('click', function() {
				d.getElementById('message').innerHTML = "";
			});
		},
		showEmoji:function(){
			this._initialEmoji();
			document.getElementById('emoji').addEventListener('click', function(e) {
				var emojiwrapper = document.getElementById('emojiWrapper');
				emojiwrapper.style.display = 'block';
				w.scrollTo(0,CHAT.msgObj.clientHeight);
				e.stopPropagation();
			}, false);
			document.body.addEventListener('click', function(e) {
				var emojiwrapper = document.getElementById('emojiWrapper');
				if (e.target != emojiwrapper) {
					emojiwrapper.style.display = 'none';
				};
				e.stopPropagation();
			});
			document.getElementById('emojiWrapper').addEventListener('click', function(e) {
				var target = e.target;
				if (target.nodeName.toLowerCase() == 'img') {
					var messageInput = document.getElementById('content');
					messageInput.focus();
					messageInput.value = messageInput.value + '[emoji:' + target.title + ']';
				};
			}, false);
			document.getElementById('content').addEventListener('keyup', function(e) {
				var messageInput = document.getElementById('content'),
					msg = messageInput.value;
				if (e.keyCode == 13 && msg.trim().length != 0) {
					messageInput.value = '';
					this.socket.emit('postMsg', msg);
					this._displayNewMsg('me', msg);
				};
			}, false);
		},
		imgchange:function(){
			var that = this;
			document.getElementById('sendImage').addEventListener('change', function() {
				var obj = {
					userid: that.userid,
					username: that.username,
					content:null
				}
				console.log(obj);
				if (this.files.length != 0) {
					var file = this.files[0],
						reader = new FileReader();
					if (!reader) {
						that._displayNewMsg('system', '!your browser doesn\'t support fileReader', 'red');
						this.value = '';
						return;
					};

					reader.onload = function(e) {
						this.value = '';
						obj.content = that._ConsoleOwnImage(obj.username, e.target.result);
						that.socket.emit('message', obj);
					};
					reader.readAsDataURL(file);
				};
			}, false);
		},
		_displayNewMsg: function(user, msg) {
			var container = document.getElementById('historyMsg'),
				msgToDisplay = document.createElement('p'),
				date = new Date().toTimeString().substr(0, 8),
			//determine whether the msg contains emoji
				msg = this._showEmoji(msg);
				console.log(msg);
			//msgToDisplay.style.color = color || '#000';
			msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span>' + msg;
			container.appendChild(msgToDisplay);
			container.scrollTop = container.scrollHeight;
		},
		_ConsoleOwnImage: function (user, imgData) {
			var div = "<img style='max-width: 99%;' src=' " + imgData + " '/>";
			return div;
		},
		_showEmoji: function(msg) {
			var match, result = msg,
				reg = /\[emoji:\d+\]/g,
				emojiIndex,
				totalEmojiNum = document.getElementById('emojiWrapper').children.length;
			while (match = reg.exec(msg)) {
				emojiIndex = match[0].slice(7, -1);
				if (emojiIndex > totalEmojiNum) {
					result = result.replace(match[0], '[X]');
				} else {
					result = result.replace(match[0], '<img class="emoji" style="width:70px;height:90px;" src="../content/emoji/' + emojiIndex + '.gif" />');//todo:fix this in chrome it will cause a new request for the image
				};
			};
			return result;
		},
		_initialEmoji:function() {
			var emojiContainer = document.getElementById('emojiWrapper'),
				docFragment = document.createDocumentFragment();
			for (var i = 69; i > 0; i--) {
				var emojiItem = document.createElement('img');
				emojiItem.src = '../content/emoji/' + i + '.gif';
				emojiItem.title = i;
				//emojiItem.style="width:15px;";
				docFragment.appendChild(emojiItem);
			};
			emojiContainer.appendChild(docFragment);
		},

		//提交聊天消息内容
		submit:function(){
			//document.getElementById('mjr_send').addEventListener('click', function() {
			var messageInput = document.getElementById('content'),
				msg = messageInput.value;
			messageInput.value = '';
			messageInput.focus();
			var obj = {
				userid: this.userid,
				username:this.username,
				content:msg
			}
			console.log(obj);
			if (msg.trim().length != 0) {

				obj.content = this._ConsoleOwn(this.username, msg);
				this.socket.emit('message', obj);
				//that._displayNewMsg1('me', msg, color,'own');

				return;
			};
		},
		_ConsoleOwn: function (user, msg) {
			msg = this._showEmoji(msg);
			return msg;
		},
		genUid:function(){
			return new Date().getTime()+""+Math.floor(Math.random()*899+100);
		},
		//更新系统消息，本例中在用户加入、退出的时候调用
		updateSysMsg:function(o, action){
			//当前在线用户列表
			var onlineUsers = o.onlineUsers;
			//当前在线人数
			var onlineCount = o.onlineCount;
			//新加入用户的信息
			var user = o.user;
				
			//更新在线人数
			var userhtml = '';
			var separator = '';
			for(key in onlineUsers) {
		        if(onlineUsers.hasOwnProperty(key)){
					userhtml += separator+'<a class="chatuser" id='+key+'>'+onlineUsers[key]+'</a>';
					separator = '、';
				}
		    }
			d.getElementById("onlinecount").innerHTML = '当前共有 '+onlineCount+' 人在线，在线列表：'+userhtml;
			
			//添加系统消息
			var html = '';
			html += '<div class="msg-system">';
			html += user.username;
			html += (action == 'login') ? ' 加入了聊天室' : ' 退出了聊天室';
			html += '</div>';
			var section = d.createElement('section');
			section.className = 'system J-mjrlinkWrap J-cutMsg';
			section.innerHTML = html;
			this.msgObj.appendChild(section);	
			this.scrollToBottom();
		},
		//第一个界面用户提交用户名
		usernameSubmit:function(){
			//var username = d.getElementById("username").innerHTML;
			var username = sessionStorage.name;
			if(username != ""){
				d.getElementById("username").value = '';
				d.getElementById("loginbox").style.display = 'none';
				d.getElementById("chatbox").style.display = 'block';
				this.init(username);
			}
			return false;
		},

		init:function(username){
			/*
			客户端根据时间和随机数生成uid,这样使得聊天室用户名称可以重复。
			实际项目中，如果是需要用户登录，那么直接采用用户的uid来做标识就可以
			*/
			this.userid = this.genUid();
			this.username = username;
			
			d.getElementById("showusername").innerHTML = this.username;
			//this.msgObj.style.minHeight = (this.screenheight - db.clientHeight + this.msgObj.clientHeight) + "px";
			this.scrollToBottom();
			
			//连接websocket后端服务器
			this.socket = io.connect();

			//告诉服务器端有用户登录
			this.socket.emit('login', {userid:this.userid, username:this.username});
			//监听新用户登录
			this.socket.on('login', function(o){
				CHAT.updateSysMsg(o, 'login');	
			});
			
			//监听用户退出
			this.socket.on('logout', function(o){
				CHAT.updateSysMsg(o, 'logout');
			});
			
			//监听消息发送
			this.socket.on('message', function(obj){
				var isme = (obj.userid == CHAT.userid) ? true : false;
				var contentDiv = '<div>'+obj.content+'</div>';
				var usernameDiv = '<span>'+obj.username+'</span>';
				var section = d.createElement('section');
				if(isme){
					section.className = 'user';
					section.innerHTML = contentDiv + usernameDiv;
				} else {
					section.className = 'service';
					section.innerHTML = usernameDiv + contentDiv;
				}
				CHAT.msgObj.appendChild(section);
				CHAT.scrollToBottom();
			});

		}
	};



	//通过“回车”提交用户名
	d.getElementById("username").onkeydown = function(e) {
		e = e || event;
		if (e.keyCode === 13) {
			CHAT.usernameSubmit();
		}
	};
	//通过“回车”提交信息
	d.getElementById("content").onkeydown = function(e) {
		e = e || event;
		if (e.keyCode === 13) {
			$.ajax({
				type:'post',
				url:'/forbid',
				data:{"id":sessionStorage.loginid},
				success:function(data){
					if(!data.isDelete&&!data.forbid){
						$('#content').attr('disabled',false);
						CHAT.submit();
					}else if(data.isDelete){
						alert('已被踢出聊天室');
						location.href = "/login";
					}else{
						alert('已被禁言');
						$('#content').attr('disabled','disabled');
					}
				}
			})
		}
	};
})();