var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server, { log: false })
  , fs = require('fs');
server.listen(7331);

app.get('/', function(req, res){
	fs.readFile(__dirname + '/client.html', function(err, data) {
		if (err) {
	      res.writeHead(500);
	      return res.end('Error loading client.html');
	    }
	    res.writeHead(200);
	    res.end(data);
	});
});

app.use('/images', express.static(__dirname + '/images'));
app.use('/javascript', express.static(__dirname + '/javascript'));

//起始位置
var startLeft = 100;
var startTop = 100;

//移動範圍
var boundWidth = startLeft + 800; //data.boundWidth;
var boundHeight = startTop + 600; //data.boundWidth;

//角色位置
var avatarLeft = startLeft;
var avatarTop = startTop;

//角色對話框
var hanashi;

var turn = 0; //左右
var move = 0; //上下
var sign; //1, -1

//玩家人數
var nowClient = 0;
//玩家姓名
var clientArr = new Array();
//贈送話語
var kotobaArr = new Array();
//贈送圖片
var eizouArr = new Array();

var r = false;

io.sockets.on('connection', function(socket) {

	var offset = 1000;
	var username;

	//啟動後持續偵測
	if(r == false) {
		r = setInterval(function() {

			turn = (turn!==0)?turn:useceil(1,3); //1=forward, 2=left, 3=right, 4=nod
			move = (move!==0)?move:useceil(1,3); //1=stand, 2=up, 3=down
			sign = (move==1)?-1:1;

			//限制左右不超過範圍
			if(avatarLeft - 30 < startLeft) {
			  turn = 3;
			}
			else if(avatarLeft + 30 + 100 > boundWidth) {
			  turn = 2;
			}
			//限制上下不超過範圍
			if(avatarTop - 30 < startTop) {
			  sign = 1;
			}
			else if(avatarTop + 60 + 100 > boundHeight) {
			  sign = -1;
			}

			//動作判別
			if(turn == 1) { //正面站定
			  socket.broadcast.emit('avatar_data', {
		  		imgurl: "url('images/girl.png') no-repeat",
		  		left: avatarLeft,
		  		top: avatarTop
			  });
			  turn = 0;
			  move = 0;
			}
			else if(turn == 2) { //左(上/下)移
			  avatarLeft -= 30;
			  avatarTop += (30 * sign);

			  socket.broadcast.emit('avatar_data', {
		  		imgurl: "url('images/girl - walkLeft.png') no-repeat",
		  		left: avatarLeft,
		  		top: avatarTop
			  });
			  turn = 0;
			  move = 0;
			}
			else if(turn == 3) { //右(上/下)移
			  avatarLeft += 30;
			  avatarTop += (30 * sign);

			  socket.broadcast.emit('avatar_data', {
		  		imgurl: "url('images/girl - walkRight.png') no-repeat",
		  		left: avatarLeft,
		  		top: avatarTop
			  });
			  turn = 0;
			  move = 0;
			}
			else if(turn >= 4) { //動作: 敬禮, 喜, 怒, 羞

			  var img_arr = ["nod", "happy", "angry", "shy"];
			  socket.broadcast.emit('avatar_data', {
		  		imgurl: "url('images/girl - "+img_arr[turn-4]+".png') no-repeat",
		  		left: avatarLeft,
		  		top: avatarTop
			  });

			  socket.broadcast.emit('bubble_data', {
			  	left: (avatarLeft + 100),
			  	top: avatarTop,
			  	text: hanashi
			  });
			  turn = 1;
			  move = 1;
			}

			socket.broadcast.emit('server_data', {
				nowClient: nowClient
			});

			socket.broadcast.emit('clientArr', {
				clientArr: clientArr
			});
			
		}, offset);
	}

	socket.on('client_data', function(data) {
		nowClient ++;
		
		turn = 4;
		hanashi = "お帰りなさい、御主人様";

		username = data.username;
		clientArr.push(username);
		removeDuplicates(clientArr);
	});

	socket.on('disconnect', function() {
		nowClient --;

		turn = 4;
		hanashi = "行ってらっしゃいませ、御主人様";

		clientArr.removeElement(username);
	});

	socket.on('gift_data', function(data) {
		if(data.text.search("幹你娘") != -1) {
			turn = 6;
			hanashi = "汚いの言葉なんか、大嫌い";
		}
		else if(data.text.search("我愛你") != -1) {
			turn = 7;
			hanashi = "そ！そんな事言われても嬉しくない";
		}
		else { 
			turn = 5;
			hanashi = "ああ、嬉しい";
		}

		var str = data.text.trim();

		//only accept image url
		if(str.substr(0, 7) == "http://" && (str.substr(-4).toLowerCase() == ".jpg" || str.substr(-4).toLowerCase() == ".png")) {
			eizouArr.push(str);
		}
		//or text
		else {
			kotobaArr.push(str);
		}
		console.log(kotobaArr);
	});
});

//取亂數
function useceil(min,max) {
  return Math.ceil(Math.random()*(max-min+1)+min-1);
}

var arrayContains = Array.prototype.indexOf ?
    function(arr, val) {
        return arr.indexOf(val) > -1;
    } :

    function(arr, val) {
        var i = arr.length;
        while (i--) {
            if (arr[i] === val) {
                return true;
            }
        }
        return false;
    }

	function removeDuplicates(arr) {
    var val, originalArr = arr.slice(0);
    arr.length = 0;

    for (var i = 0, len = originalArr.length; i < len; ++i) {
        val = originalArr[i];
        if (!arrayContains(arr, val)) {
            arr.push(val);
        }
    }

    return arr;
}

Array.prototype.removeElement= function(){
    var what, a= arguments, L= a.length, ax;
    while(L && this.length){
        what= a[--L];
        while((ax= this.indexOf(what))!= -1){
            this.splice(ax, 1);
        }
    }
    return this;
}