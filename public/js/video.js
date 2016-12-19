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

				var lights = function(allLights){

				};

				var authorized = function(user){
					Philips.getLights(lights);
				};

				var discovered = function(bridge){
					Philips.authorize(authorized)
				};

				Philips.discoverBridge(discovered);

			});
		},

		showVideo: function(video, context, width, height){
			context.drawImage(video, 0, 0, width, height);
			
			Video.drawColor();

			setTimeout(Video.showVideo, 500, video, context, width, height);	
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

					//Philips hue lights are found and available					
					if(Philips.allLights !== null && swatch === 'Vibrant'){
						$.each(Philips.allLights, function(index, light){
							var rgb = Philips.convertHexToRGB("0x" + hex.substring(1, hex.length));
							var xyColor = Philips.convertToICEColor(rgb[0], rgb[1], rgb[2]);
							var lightState = {
								 on: true, 
								 xy: xyColor
							}

							Philips.user.setLightState(index, lightState, function(data) {
							 //color succesful changed 
							}, 
							function(error){
							//error occurs
							});
						});
					}

					//debug:
					//console.log(swatch, swatches[swatch].getHex());
				}
			}	
		}
	}

	var Philips={
		hue: null,

		bridge: null,
		
		user: null,
		
		allLights: null,

		setLight: function(){

		},
		
		convertHexToRGB: function(hex){
			// convert a hexidecimal color string to 0..255 R,G,B
		    var r = hex >> 16;
		    var g = hex >> 8 & 0xFF;
		    var b = hex & 0xFF;

		    return [r,g,b];
		},

		convertToICEColor: function(red, green, blue){

            //Gamma correctie
            red = (red > 0.04045) ? Math.pow((red + 0.055) / (1.0 + 0.055), 2.4) : (red / 12.92);
            green = (green > 0.04045) ? Math.pow((green + 0.055) / (1.0 + 0.055), 2.4) : (green / 12.92);
            blue = (blue > 0.04045) ? Math.pow((blue + 0.055) / (1.0 + 0.055), 2.4) : (blue / 12.92);
            
            //Apply wide gamut conversion D65
            var X = red * 0.664511 + green * 0.154324 + blue * 0.162028;
            var Y = red * 0.283881 + green * 0.668433 + blue * 0.047685;
            var Z = red * 0.000088 + green * 0.072310 + blue * 0.986039;
            
            var fx = X / (X + Y + Z);
            var fy = Y / (X + Y + Z);
            if (isNaN(fx)) {
                fx = 0;
            }
            if (isNaN(fy)) {
                fy = 0;
            }
            
            return [Number(fx.toPrecision(4)), Number(fy.toPrecision(4))];
                
		},

		getLights: function(success){

			Philips.user.getLights(function(lights){
				Philips.allLights = lights;
				success(lights);
			}, 
			function(error){

			});
		},

		discoverBridge: function(success, error){
			Philips.hue=jsHue();

			Philips.hue.discover(function(bridges) {
		        if(bridges.length === 0) {
		            console.log('No bridges found. :(');
		            error();
		        }else {
		            bridges.forEach(function(b) {
		                console.log('Bridge found at IP address %s.', b.internalipaddress);
		                var bridge = Philips.hue.bridge(b.internalipaddress);
		            	Philips.bridge = bridge;
		            	success(bridge);
		            });
		        }
			}, function(error) {
		        console.error(error.message);
			});
		},

		authorize: function(successCb, error){

			if(window.localStorage.getItem("user") === null){
				// create user account (requires link button to be pressed)
				Philips.bridge.createUser('ambi#html', function(data) {
				    // extract bridge-generated username from returned data
				    if (typeof data[0].error === "undefined"){
					    var username = data[0].success.username;

					    console.log('New username:', username);

					    //save username
					    window.localStorage.setItem("user", username);

					    // instantiate user object with username
					    var user = Philips.bridge.user(username);
					    //set gui status
					    $("#userstatus").html("");
					    Philips.user = user;
					    //callback
					    successCb(user);
					}else{
				    	if (data[0].error.type == 101){
					    	//gui status
							$("#userstatus").html("Press link button!");
							//try again later
							setTimeout(Philips.authorize, 1000, Philips.bridge);
				    	}
					}
				});
			}else{
				var user = Philips.bridge.user(window.localStorage.getItem("user"));
				Philips.user = user;
				successCb(user);
			}
		}
	}

	Video.init();

});

