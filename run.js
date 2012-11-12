//語言
var lang = "en";

//圖片路徑
var remote = "";
var imgurl = remote + "images/";

//起始位置
var startLeft = 100;
var startTop = 100;

//移動範圍
var boundWidth = startLeft + 800; //data.boundWidth;
var boundHeight = startTop + 600; //data.boundWidth;

//角色位置
var avatarLeft = startLeft;
var avatarTop = startTop;

var turn = 0; //動作
var hanashi; //對話

var nxtTurn = 0; //下個動作

var gift_min = 3; //Any手中禮物大於特定數即可送禮

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
//公開訊息
var newsArr = new Array();

var r = false; //避免重複interval

var express = require('express')
  , app = express()
  , http = require('http')
  , server = http.createServer(app)
  , io = require('socket.io').listen(server, { log: false })
  , fs = require('fs')
  , Localize = require('localize');

server.listen(7331);

//翻譯
var local = new Localize({
    "Hello": {
        "zh": "你好",
        "jp": "こんにちわ"
    },
    "Error loading client.html": {
    	"zh": "讀取 client.html 發生錯誤"
    },
    "Welcome back, my lord.": {
    	"zh": "歡迎回來~ 主人 >///<",
    	"ja": "お帰りなさいませ、御主人様"
    },
    "$[1] send a gift to Any.": {
    	"zh": "$[1] 送了一份禮物給安麗!",
    	"ja": "$[1] はエーニちゃんにプレゼントをあげました！"
    },
    "Have a nice day, my lord.": {
    	"zh": "主人慢走~ ^///^",
    	"ja": "行ってらっしゃいませ、御主人様"
    },
    "Ewww... I hate dirty words!": {
    	"zh": "髒話什麼的最討厭了 >\"<",
    	"ja": "汚いの言葉なんか、大嫌い！"
    },
    "Its so romantic... But! not becuz you say that.": {
    	"zh": "就、就算你這麼說，我也不會開心的 `///ˊ",
    	"ja": "そ、そんな事言われても嬉しくない！"
    },
    "You are so kind.": {
    	"zh": "主人你真好！",
     	"ja": "ああ、嬉しい。"
 	},
    "Thank you very much, my lord.": {
    	"zh": "非常謝謝你，主人 ^_^",
    	"ja": "ありがとうございます、御主人様。"
    }
});

app.configure(function() {
	//根據Header判斷語系
    app.use(function(request, response, next) {
    	if(request.headers["accept-language"].search("zh-TW") != -1) {
    		lang = "zh";
    	}
    	else if(request.headers["accept-language"].search("ja-JP") != -1) {
    		lang = "ja";
    	}
    	else {
    		lang = "en";
    	}
        local.setLocale(lang);
        next();
    });
    //路徑重導
	app.use('/images', express.static(__dirname + '/images'));
	app.use('/javascript', express.static(__dirname + '/javascript'));
	app.use('/css', express.static(__dirname + '/css'));
	app.use('/translations', express.static(__dirname + '/translations'));

	app.get('/', function(req, res){
		fs.readFile(__dirname + '/client.html', function(err, data) {
			if (err) {
		      res.writeHead(500);
		      return res.end(local.translate("Error loading client.html"));
		    }
		    res.writeHead(200);
		    res.end(data);
		});
	});
});

io.sockets.on('connection', function(socket) {

	var offset = 1000;
	var username;

	//送圖片路徑至客戶端
	socket.emit('global_data', {
		lang: lang,
		imgurl: imgurl
	});
	//送圖片連結至客戶端做快取
	socket.emit('images_data', {
		normal: createImages("nm", 1, 7),
		special: createImages("sp", 1, 10)
	});

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
			if(turn < 4) {

				if(turn == 1) {} //正面站定
				if(turn == 2) { //左移
					avatarLeft -= 30;
					avatarTop += (30 * sign); //上或下移
				}
				else if(turn == 3) { //右移
					avatarLeft += 30;
					avatarTop += (30 * sign); //上或下移
				}

				//移動
				socket.broadcast.emit('avatar_data', {
					imgid: "nm"+turn,
					left: avatarLeft,
			 		top: avatarTop
				});

				turn = 0;
				move = 0;
			}
			else if(turn >= 4) { //動作: 敬禮, 喜, 怒, 羞

				//移動
				socket.broadcast.emit('avatar_data', {
					imgid: "nm"+turn,
					left: avatarLeft,
			 		top: avatarTop
				});
				//說話
				socket.broadcast.emit('bubble_data', {
					left: (avatarLeft + 100),
					top: avatarTop,
					text: hanashi
				});

				turn = nxtTurn;
				move = 1;
			}

			//伺服器資訊
			socket.broadcast.emit('server_data', {
				nowClient: nowClient
			});

			//客戶端資訊
			socket.broadcast.emit('client_data', {
				arr: clientArr
			});

			socket.broadcast.emit('news_data', {
				arr: newsArr
			});
			
		}, offset);
	}

	socket.on('client_data', function(data) {
		nowClient ++;
		
		turn = 4;
		nxtTurn = 1;
		hanashi = local.translate("Welcome back, my lord.");

		username = data.username;
		clientArr.push(username);
		removeDuplicates(clientArr); //去除重複名稱
	});

	socket.on('news_data', function(data) {
		username = data.username;
		newsArr.push(local.translate("$[1] send a gift to Any.", username));
		if(newsArr.length >= 15) {
			newsArr.shift();
		}
	});

	socket.on('disconnect', function() {
		nowClient --;

		turn = 4;
		nxtTurn = 1;
		hanashi = local.translate("Have a nice day, my lord.");

		clientArr.removeElement(username);
	});

	socket.on('gift_data', function(data) {

		var str = data.text.trim();
		var thx = true;

		if(str.search("fuck") != -1 || str.search("幹你") != -1) {
			turn = 6;
			hanashi = local.translate("Ewww... I hate dirty words!");
			thx = false;
		}
		else if(str.search("love you") != -1 || str.search("愛你") != -1) {
			turn = 7;
			hanashi = local.translate("Its so romantic... But! not becuz you say that.");
		}
		else {
			turn = 5;
			hanashi = local.translate("You are so kind.");
		}
		setTimeout(function() {
			if(thx) {
				turn = 4;
				hanashi = local.translate("Thank you very much, my lord.");
			}

			console.log(eizouArr);
			console.log(kotobaArr);

			var s;
			//only accept image url
			if(str.substr(0, 7) == "http://" && (str.substr(-4).toLowerCase() == ".jpg" || str.substr(-4).toLowerCase() == ".png")) {
				eizouArr.push(str);
				eizouArr.shuffle();
				if(eizouArr.length >= gift_min && useceil(0,1)) {
					s = eizouArr.shift();
					socket.emit('gift_to_client', {
						img: s
					});
					console.log("Output '"+s+"'");
				}
			}
			//or text
			else {
				kotobaArr.push(str);
				kotobaArr.shuffle();
				if(kotobaArr.length >= gift_min && useceil(0,1)) {
					s = kotobaArr.shift();
					socket.emit('gift_to_client', {
						text: s
					});
					console.log("Output '"+s+"'");
				}
			}
		}, 2000);
	});
});

//取亂數
function useceil(min,max) {
  return Math.ceil(Math.random()*(max-min+1)+min-1);
}

//建置所有會使到的圖片陣列
function createImages(prefix, begin, end) {

	var imageArray = new Array();

	for(var i = begin; i <= end; i ++) {
		imageArray.push( (prefix + i) );
	}

	return imageArray;
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

Array.prototype.shuffle = function(){ //v1.0
	var o = arguments;
    for(var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};