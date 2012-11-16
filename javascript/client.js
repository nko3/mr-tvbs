function letsPlay() {

    var lang;
    var translation = {
        "vote": {
            "en": "Support us",
                "zh": "幫我們投票加油",
                "ja": "私たちにサポートする"
        },
            "online_user": {
            "en": "Online user",
                "zh": "線上人數",
                "ja": "オンライン人数"
        },
            "person": {
            "en": "",
                "zh": "人",
                "ja": "人"
        },
            "sidebar_title": {
            "en": "Give Any a present",
                "zh": "送安麗一個禮物",
                "ja": "プレゼントをエーニちゃんにあげる"
        },
            "placeholder": {
            "en": "text or image url",
                "zh": "文字或圖片連結",
                "ja": "文字や画像にりんくを貼る"
        },
            "send": {
            "en": "Send",
                "zh": "送出",
                "ja": "贈る"
        },
            "special_message": {
            "en": "I... I have a present for you.",
                "zh": "那個... 我有一個禮物要送你 。///。",
                "ja": "あの、、、これプレゼントをあげる 。///。"
        },
            "maintain_message": {
            "en": "Sorry, I'll be back soon. :)",
                "zh": "不好意思喔~ 我很快就會回來的 :)",
                "ja": "すみません、すぐに戻る"
        }
    };

    var socket = io.connect('http://' + hostname, {
        'force new connection': true
    });

    socket.on('connect', function () {
        disableSpeak("n");
        $("#text").focus();

        socket.emit('client_data', {
            username: username
        });
    });

    socket.on('disconnect', function () {
        var middleLeft = document.body.clientWidth / 2 - 100;
        var middleTop = document.body.clientHeight / 2;
        appearAny(middleLeft, middleTop, "http://i.imgur.com/iXzSA.png");
        appearBubble(middleLeft + 90, middleTop, translation["maintain_message"][lang]);
        disableSpeak("y");
    });

    customEvent();

    //send text to server
    $("#send").click(function () {
        socket.emit('gift_data', {
            text: $("#text").prop("value")
        });
        $("#text").prop("value", "");
        $("#text").focus();
        //can not speak due to motion end
        disableSpeak("y");
        //public message to everyone
        socket.emit('news_data', {});
    });

    //language switcher
    $("#lang_select").change(function() {
        socket.emit('lang_change', {lang: $(this).prop("value")});
        lang = $(this).prop("value"); //client.html lang
        localize($(this).prop("value")); //change objs lang in client.html
    });

    //網站文字翻譯
    function localize(lang) {
        $("#vote").html(translation["vote"][lang]);
        $("#online_user").html(translation["online_user"][lang]);
        $("#person").html(translation["person"][lang]);
        $("#sidebar_title").html(translation["sidebar_title"][lang]);
        $("#text").prop("placeholder", translation["placeholder"][lang]);
        $("#send").prop("value", translation["send"][lang]);
        //切換select option
        $("#lang_select option[value='"+lang+"']").prop("selected", "selected");
    }

    var imgurl;
    var accept_from_server = true;

    //客製化事件傳遞
    function customEvent() {

        var global_data = function (data) {
            //定義全域變數
            lang = data.lang;
            imgurl = data.imgurl;
            localize(lang);
        };
        var images_data = function (data) {
            // Add hidden element
            var hidden = $('body').append('<div id="img-cache" style="display:none" />').children('#img-cache');

            $.each(data.special, function (i, val) {
                $('<img/>').prop('id', val).prop('src', imgurl + val + ".png").appendTo(hidden);
            });

            // Add images to hidden element.
            $.each(data.normal, function (i, val) {
                $('<img/>').prop('id', val).prop('src', imgurl + val + ".png").appendTo(hidden);
            });
        };
        var server_data = function (data) {
            //refresh online user
            $("#nowClient").html(data.nowClient);

            //refresh public message
            var html = "";
            var arr = new Array();
            arr = data.newsArr;
            for (var i = arr.length - 1; i >= 0; i--) {
                html += "<tr><td>" + arr[i] + "</td></tr>";
            }
            $("#news_data").html(html);
        };
        var client_data = function (data) {
            var html = "";
            var arr = new Array();
            arr = data.arr;
            for (var i = 0; i < arr.length; i++) {
                html += "<tr><td>" + arr[i] + "</td></tr>";
            }
            $("#client_data").html(html);
        };
        var avatar_data = function (data) {
            if (accept_from_server == true) {
                //follow the data from server to control avatar
                appearAny(data.left, data.top, data.imgid);
                if (data.imgid == "nm4" || data.imgid == "nm6") {
                    //continue let user speak
                    disableSpeak("n");
                }
            }
        };
        var bubble_data = function (data) {
            if (accept_from_server == true) {
                appearBubble(data.left, data.top, data.text);
            }
        };
        var gift_to_client = function (data) {

            //reset
            $("#gift").hide(0);
            $("#gift").css("z-index", "999");
            $("#gift").transition({
                scale: 1
            });

            var str;
            if (data.text != undefined) {
                str = data.text;
            } else if (data.img != undefined) {
                str = "<img src='" + data.img + "' width='50'>";
            }

            //take over avatar controll from server
            accept_from_server = false;

            var timeoffset = 250;
            var avatarLeft = parseInt($("#any").css("left"), 10);
            var avatarTop = parseInt($("#any").css("top"), 10);
            appearAny(avatarLeft, avatarTop, "nm4");
            appearBubble((avatarLeft + 100), avatarTop, translation["special_message"][lang])

            $("#any").delay(2000);

            $("#any").queue(function () {
                $("#bubble").hide(0);
                $("#any img").prop("src", imgurl + "sp1.png");
                $(this).dequeue();
            }).delay(timeoffset);

            $("#any").queue(function () {
                $("#any img").prop("src", imgurl + "sp2.png");
                $(this).dequeue();
            }).delay(timeoffset);
            $("#any").queue(function () {
                $("#any img").prop("src", imgurl + "sp3.png");
                $(this).dequeue();
            }).delay(timeoffset);
            $("#any").queue(function () {
                $("#any img").prop("src", imgurl + "sp4.png");
                $(this).dequeue();
            }).delay(timeoffset);
            $("#any").queue(function () {
                $("#any img").prop("src", imgurl + "sp1.png");
                $(this).dequeue();
            }).delay(timeoffset);
            $("#any").queue(function () {
                $("#any img").prop("src", imgurl + "sp5.png");
                $(this).dequeue();
            }).delay(timeoffset);
            $("#any").queue(function () {
                $("#any img").prop("src", imgurl + "sp6.png");
                $(this).dequeue();
            }).delay(timeoffset);
            $("#any").queue(function () {
                $("#any img").prop("src", imgurl + "sp7.png");
                $(this).dequeue();
            }).delay(timeoffset);
            $("#any").queue(function () {
                $("#any img").prop("src", imgurl + "sp8.png");
                $(this).dequeue();
            }).delay(timeoffset);
            $("#any").queue(function () {
                $("#any img").prop("src", imgurl + "sp9.png");
                $(this).dequeue();
            }).delay(timeoffset);
            $("#any").queue(function () {
                $("#any img").prop("src", imgurl + "sp10.png");
                $(this).dequeue();
            }).delay(timeoffset);

            $("#any").queue(function () {

                $("#gift").html(str);

                var giftWidth = parseInt($("#gift").css("width"), 10);
                var giftHeight = parseInt($("#gift").css("height"), 10);

                var boxLeft = avatarLeft + 50;
                var boxTop = avatarTop + 50;

                $("#gift").css("left", boxLeft);
                $("#gift").css("top", boxTop);

                var middleLeft = document.body.clientWidth / 2;
                var middleTop = document.body.clientHeight / 2;

                $("#gift").show(0);

                $("#gift").animate({
                    left: middleLeft,
                    top: middleTop
                });

                $("#gift").transition({
                    scale: 10
                });

                $(this).dequeue();

            }).delay(timeoffset + 2000);

            $("#any").queue(function () {
                //continue let server control avatar
                accept_from_server = true;
                //continue let user speak
                disableSpeak("n");
                $(this).dequeue();
            });
        };
        socket.on('global_data', global_data);
        socket.on('server_data', server_data);
        socket.on('client_data', client_data);
        socket.on('images_data', images_data);
        socket.on('avatar_data', avatar_data);
        socket.on('bubble_data', bubble_data);
        socket.on('gift_to_client', gift_to_client);
    }
}