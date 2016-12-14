$(function(){

	function video(){
		var canvas = document.getElementById('canvas'),
			context = canvas.getContext('2d'),
			video = document.getElementById('video'),
			vendorURL = window.URL || window.webkitURL;

		navigator.getMedia = navigator.getUserMedia ||
							 navigator.webkitGetUserMedia ||
							 navigator.mozGetUserMedia ||
							 navigator.msGetUserMedia;	

		navigator.getMedia({
			video: true,
			audio: false
		}, function(stream){
			video.src = vendorURL.createObjectURL(stream);
			video.play();
		}, function(error){

		});

		video.addEventListener('play', function(){
			draw(this, context, 400, 300);
			
			/*
			discoverHue(function(bridge){
				authorize(bridge, function(bridge, user){

				},function(){

				});
			});
			*/
			var bridge = function(bridge){
				authorize(bridge, function(bridge, user){

				},function(){

				});
			}
			
			discoverHue(bridge);
		});

		function draw(video, context, width, height){
			context.drawImage(video, 0, 0, width, height);
			
			$("#colorlist").html('');
			var picture = canvas.toDataURL('image/jpeg');
			var img = document.createElement('img');
			img.setAttribute('src', picture);

			var vibrant = new Vibrant(img);
			var swatches = vibrant.swatches();
			for (swatch in swatches){
				if (swatches.hasOwnProperty(swatch) && swatches[swatch]){
					var hex = swatches[swatch].getHex();
					$("#colorlist").append('<div class="mycolor" style="background: ' + hex + ';">' + swatch + '</div>');
					//console.log(swatch, swatches[swatch].getHex());
				}
			}

			setTimeout(draw, 100, video, context, width, height);
		}

		function discoverHue(success, error){
			var hue = jsHue();

			hue.discover(function(bridges) {
		        if(bridges.length === 0) {
		            console.log('No bridges found. :(');
		            error();
		        }
		        else {
		            bridges.forEach(function(b) {
		                console.log('Bridge found at IP address %s.', b.internalipaddress);
		                var bridge = hue.bridge(b.internalipaddress);
		            	success(bridge);
		            });
		        }
			}, function(error) {
		        console.error(error.message);
			});
		}

		function authorize(bridge, success, error){
			if(window.localStorage.getItem("user") === null){
				// create user account (requires link button to be pressed)
				bridge.createUser('ambi#html', function(data) {
				    // extract bridge-generated username from returned data
				    if (typeof data[0].error === "undefined"){
					    var username = data[0].success.username;

					    console.log('New username:', username);
					    // instantiate user object with username
					    var user = bridge.user(username);
					    //set gui status
					    $("#userstatus").html("");
					    //save whitelist user
					    window.localStorage.setItem("user", user);
					    //callback
					    success(bridge, user);
					}else{
				    	if (data[0].error.type == 101){
					    	//gui status
							$("#userstatus").html("Press link button!");
							//try again
							setTimeout(authorize, 1000, bridge);
				    	}
					}
				}
				);
			}else{
				success(bridge, window.localStorage.getItem("user"));
			}
		}
	}

	video();
});

