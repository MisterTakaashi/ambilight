$(function(){

	var Video = {
		canvas: 	document.getElementById('canvas'),
		context: 	canvas.getContext('2d'),
		video: 		document.getElementById('video'),
		vendorURL: 	window.URL || window.webkitURL,

		init: function(){
			navigator.getMedia = navigator.getUserMedia ||
								 navigator.webkitGetUserMedia ||
								 navigator.mozGetUserMedia ||
								 navigator.msGetUserMedia;
			

			navigator.getMedia({
				video: true,
				audio: false
				}, function(stream){
					video.src = Video.vendorURL.createObjectURL(stream);
					video.play();
				}, function(error){

				}
			);

			this.initListeners();
		},

		initListeners: function(){

			video.addEventListener('play', function(){
				Video.showVideo(this, Video.context, 400, 300);
				
				/*
				var bridge = function(bridge){
					authorize(bridge, function(bridge, user){

					},function(){

					});
				}

				discoverHue(bridge);
				*/
				Philips.discoverBridge(function(bridge){
					Philips.authorize(function(user){

					});
				});
			});
		},

		showVideo: function(video, context, width, height){
			context.drawImage(video, 0, 0, width, height);
			
			Video.drawColor();

			setTimeout(Video.showVideo, 100, video, context, width, height);	
		},

		drawColor: function(){
			//remove the old colors
			$("#colorlist").html('');

			//create a image element with the picture as base64
			var picture = canvas.toDataURL('image/jpeg');
			var img = document.createElement('img');
			img.setAttribute('src', picture);

			//instanciate the vibrant library
			var vibrant = new Vibrant(img);
			var swatches = vibrant.swatches();
			for (swatch in swatches){
				if (swatches.hasOwnProperty(swatch) && swatches[swatch]){
					var hex = swatches[swatch].getHex();
					//draw a div in the corresponding color
					$("#colorlist").append('<div class="mycolor" style="background: ' + hex + ';">' + swatch + '</div>');
					
					//debug:
					//console.log(swatch, swatches[swatch].getHex());
				}
			}	
		}
	}

	var Philips={
		bridge: null,
		user: null,

		discoverBridge: function(success, error){
			var hue = jsHue();

			var thiz = this;
			hue.discover(function(bridges) {
		        if(bridges.length === 0) {
		            console.log('No bridges found. :(');
		            error();
		        }else {
		            bridges.forEach(function(b) {
		                console.log('Bridge found at IP address %s.', b.internalipaddress);
		                var bridge = hue.bridge(b.internalipaddress);
		            	thiz.bridge = bridge;
		            	success(bridge);
		            });
		        }
			}, function(error) {
		        console.error(error.message);
			});
		},

		authorize: function(success, error){
			if(window.localStorage.getItem("user") === null){
				// create user account (requires link button to be pressed)
				Philips.bridge.createUser('ambi#html', function(data) {
				    // extract bridge-generated username from returned data
				    if (typeof data[0].error === "undefined"){
					    var username = data[0].success.username;

					    console.log('New username:', username);
					    // instantiate user object with username
					    var user = Philips.bridge.user(username);
					    //set gui status
					    $("#userstatus").html("");
					    //save whitelist user
					    window.localStorage.setItem("user", user);
					    Philips.user = user;
					    //callback
					    success(user);
					}else{
				    	if (data[0].error.type == 101){
					    	//gui status
							$("#userstatus").html("Press link button!");
							//try again later
							setTimeout(Philips.authorize, 1000, Philips.bridge);
				    	}
					}
				}
				);
			}else{
				Philips.user = window.localStorage.getItem("user");
				success(window.localStorage.getItem("user"));
			}
		}
	}

	Video.init();

	// function video(){
	// 	var canvas = document.getElementById('canvas'),
	// 		context = canvas.getContext('2d'),
	// 		video = document.getElementById('video'),
	// 		vendorURL = window.URL || window.webkitURL;

	// 	navigator.getMedia = navigator.getUserMedia ||
	// 						 navigator.webkitGetUserMedia ||
	// 						 navigator.mozGetUserMedia ||
	// 						 navigator.msGetUserMedia;	

	// 	navigator.getMedia({
	// 		video: true,
	// 		audio: false
	// 	}, function(stream){
	// 		video.src = vendorURL.createObjectURL(stream);
	// 		video.play();
	// 	}, function(error){

	// 	});

	// 	video.addEventListener('play', function(){
	// 		draw(this, context, 400, 300);
			
	// 		/*
	// 		discoverHue(function(bridge){
	// 			authorize(bridge, function(bridge, user){

	// 			},function(){

	// 			});
	// 		});
	// 		*/
	// 		var bridge = function(bridge){
	// 			authorize(bridge, function(bridge, user){

	// 			},function(){

	// 			});
	// 		}

	// 		discoverHue(bridge);
	// 	});

	// 	function draw(video, context, width, height){
	// 		context.drawImage(video, 0, 0, width, height);
			
	// 		$("#colorlist").html('');
	// 		var picture = canvas.toDataURL('image/jpeg');
	// 		var img = document.createElement('img');
	// 		img.setAttribute('src', picture);

	// 		var vibrant = new Vibrant(img);
	// 		var swatches = vibrant.swatches();
	// 		for (swatch in swatches){
	// 			if (swatches.hasOwnProperty(swatch) && swatches[swatch]){
	// 				var hex = swatches[swatch].getHex();
	// 				$("#colorlist").append('<div class="mycolor" style="background: ' + hex + ';">' + swatch + '</div>');
	// 				//console.log(swatch, swatches[swatch].getHex());
	// 			}
	// 		}

	// 		setTimeout(draw, 100, video, context, width, height);
	// 	}

	// 	function discoverHue(success, error){
	// 		var hue = jsHue();

	// 		hue.discover(function(bridges) {
	// 	        if(bridges.length === 0) {
	// 	            console.log('No bridges found. :(');
	// 	            error();
	// 	        }
	// 	        else {
	// 	            bridges.forEach(function(b) {
	// 	                console.log('Bridge found at IP address %s.', b.internalipaddress);
	// 	                var bridge = hue.bridge(b.internalipaddress);
	// 	            	success(bridge);
	// 	            });
	// 	        }
	// 		}, function(error) {
	// 	        console.error(error.message);
	// 		});
	// 	}

	// 	function authorize(bridge, success, error){
	// 		if(window.localStorage.getItem("user") === null){
	// 			// create user account (requires link button to be pressed)
	// 			bridge.createUser('ambi#html', function(data) {
	// 			    // extract bridge-generated username from returned data
	// 			    if (typeof data[0].error === "undefined"){
	// 				    var username = data[0].success.username;

	// 				    console.log('New username:', username);
	// 				    // instantiate user object with username
	// 				    var user = bridge.user(username);
	// 				    //set gui status
	// 				    $("#userstatus").html("");
	// 				    //save whitelist user
	// 				    window.localStorage.setItem("user", user);
	// 				    //callback
	// 				    success(bridge, user);
	// 				}else{
	// 			    	if (data[0].error.type == 101){
	// 				    	//gui status
	// 						$("#userstatus").html("Press link button!");
	// 						//try again
	// 						setTimeout(authorize, 1000, bridge);
	// 			    	}
	// 				}
	// 			}
	// 			);
	// 		}else{
	// 			success(bridge, window.localStorage.getItem("user"));
	// 		}
	// 	}
	// }

	// video();

});

