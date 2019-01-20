var camera, scene, renderer, controls;
var geometry, material, mesh;

var surfaceState = {
    'ui': {
        "addFile": function () {
            document.getElementById('csvInput').click();
        },
        'calls': true,
        'puts': true
    },
    // t+:srike:price
    "rawData": {},
    "allStrikes": {},
    "daysIndex": [],
    "strikesIndex": [],
    "procData": [],
    "callsFn": [],
    "putsFn": [],
    "surfaces":[],
    "clickSphere" : {}
};
var headeri = {
    "Expiration Date": 0,
    "Strike": 11,
    "Call IV": 7,
    "Put IV": 8

}
init();
animate();
createUI();

function dateDiffInDays(a) {
    const _MS_PER_DAY = 1000 * 60 * 60 * 24;
    const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    var b = new Date();
    const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.floor((utc1 - utc2) / _MS_PER_DAY);
}

function processRawItem(item) {
    //console.log(item);
    var days = parseInt(dateDiffInDays(new Date(item["data"][0][headeri["Expiration Date"]])));
    var strike = Number(item["data"][0][headeri["Strike"]]); //
    var calliv = item["data"][0][headeri["Call IV"]];
    var putiv = item["data"][0][headeri["Put IV"]];

    if (!Number.isNaN(strike) ){
      if (!(days in surfaceState["rawData"])) {
          surfaceState["rawData"][days] = {};
      }
      if (!(strike in surfaceState["rawData"][days])) {
          surfaceState["rawData"][days][strike] = {};
      }
      if (!(strike in surfaceState["allStrikes"])) {
          surfaceState["allStrikes"][strike] = 1;
      }
      surfaceState["rawData"][days][strike] = [calliv, putiv];
    }
}


function processRawDataComplete() {
    surfaceState["daysIndex"] = Object.keys(surfaceState["rawData"]).sort(function (a, b) {
        return a - b
    });
    surfaceState["strikesIndex"] = Object.keys(surfaceState["allStrikes"]).sort(function (a, b) {
        return a - b
    });
    for (var i = 0; i < surfaceState["daysIndex"].length; i++) {
        surfaceState["procData"][i] = [];
        for (var j = 0; j < surfaceState["strikesIndex"].length; j++) {
            surfaceState["procData"][i][j] = surfaceState["rawData"][surfaceState["daysIndex"][i]][surfaceState["strikesIndex"][j]];
        }
    }
    interpolate();
    drawCallsPuts();
}

// shitty empty fill w/ neighbor - my version of "middle out"
function interpolate() {


    for (var i = 0; i < surfaceState["daysIndex"].length; i++) {
        let errStepDiff= .5;

        //0 :call, 1:put
        var lastGoodVol_lower = [];
        var lastGoodVol_higher = [];

        for (var j = 0; j < Math.ceil(surfaceState["strikesIndex"].length/2)+1 ; j++) {
            let j_lower =  Math.ceil(surfaceState["strikesIndex"].length/2)+2 -j;
            let j_higher =  Math.ceil(surfaceState["strikesIndex"].length/2)-2+ j;


            if (!surfaceState["procData"][i][j_lower]) {
                surfaceState["procData"][i][j_lower] = [];
            }
            if (!surfaceState["procData"][i][j_higher]) {
                surfaceState["procData"][i][j_higher] = [];
            }

            for( var callput=0;callput<=1;callput++) {

                if (!isNaN(surfaceState["procData"][i][j_lower][callput])) {
                    lastGoodVol_lower[callput] = surfaceState["procData"][i][j_lower][callput];
                } else {
                    surfaceState["procData"][i][j_lower][callput] = lastGoodVol_lower[callput];
                }

                if (!isNaN(surfaceState["procData"][i][j_higher][callput])) {
                    lastGoodVol_higher[callput] = surfaceState["procData"][i][j_higher][callput];
                } else {
                    surfaceState["procData"][i][j_higher][callput] = lastGoodVol_higher[callput];
                }

            }



        }
    }
}

function drawCallsPuts() {
    if (surfaceState.ui["calls"]) {
        draw(0)
    }
    console.log("PUTS: " + surfaceState.ui["puts"])
    if (surfaceState.ui["puts"]) {
        draw(1)
    }
}

function getTriangles(size, i, j) {
    var f1 = (i + 1) * size + j
    var f2 = i * size + j + 1
    var f3 = (i + 1) * size + j + 1
    var f4 = i * size + j

    return [f1, f2, f3, f4];
}

function draw(callsputs01) {

      let dayLogOffset=1;
      if(surfaceState["daysIndex"][0]<0) {
        dayLogOffset=dayLogOffset+surfaceState["daysIndex"][0]*-1;
      }
  let xOffset=100;
  let yscale=2;
    let surfaceGeo = new THREE.Geometry();
    let surfaceGeoVertexVolLookup = [];

    var points = [];
    for (var i = 0; i < surfaceState["daysIndex"].length; i++) {
        for (var j = 0; j < surfaceState["strikesIndex"].length; j++) {
            if (surfaceState["procData"][i][j] && !isNaN(surfaceState["procData"][i][j][callsputs01])) {
                vol = surfaceState["procData"][i][j][callsputs01] * 100;
            } else {
                vol = 0;
            }

            var gradient = tinygradient([
                '#ff0000',
                '#00ff00',
                '#0000ff'
            ]);
            var color = gradient.reverse().hsvAt(Math.min(vol / 100, 1)).toHexString()

            var dateoffset=100;
            surfaceGeo.vertices.push(
                new THREE.Vector3( Math.log((dayLogOffset+Number(surfaceState["daysIndex"][i])))*100 * (callsputs01 == 0 ? 1 : -1), surfaceState["strikesIndex"][j]*yscale , vol * 1)
            );
            surfaceGeoVertexVolLookup.push(vol);
            if (i < surfaceState["daysIndex"].length - 1 && j < surfaceState["strikesIndex"].length - 1) {
                var ts = getTriangles(surfaceState["strikesIndex"].length, i, j);
                //  console.log("  " + f1 +","  + f2 +"," + f3 +"," + f4 +",");
                var face1 = new THREE.Face3(ts[0], ts[1], ts[2]);
                var face2 = new THREE.Face3(ts[3], ts[0], ts[1]);
                surfaceGeo.faces.push(face1);
                surfaceGeo.faces.push(face2);
            }


            //  console.log(color)
        }
    }

    // Color faces
    for (var i = 0; i < surfaceGeo.faces.length; i++) {
        var aveVol = (surfaceGeoVertexVolLookup[surfaceGeo.faces[i].a] + surfaceGeoVertexVolLookup[surfaceGeo.faces[i].b] + surfaceGeoVertexVolLookup[surfaceGeo.faces[i].c]) / 3;

        var colorhex = new THREE.Color(gradient.reverse().hsvAt(Math.min(aveVol / 100, 1)).toHexString()); //optional
        surfaceGeo.faces[i].color = colorhex;

    }

    var geoMat = new THREE.MeshLambertMaterial();

    surfaceGeo.computeFaceNormals();
    surfaceGeo.computeVertexNormals();
    geoMat.side = THREE.DoubleSide;
    geoMat.vertexColors = THREE.FaceColors;
    var surface = new THREE.Mesh(surfaceGeo, geoMat);

    surface.translateX(xOffset* (callsputs01 == 0 ? 1 : -1))
    surfaceState["surfaces"].push(surface)

    //Click intercept
    surface.callback = function(point) {


      surfaceState["clickSphere"].position.set(point["x"], point["y"],point["z"]);

      // Reverse draw function
      point["x"]=point["x"]-xOffset* (callsputs01 == 0 ? 1 : -1)
      point["x"]= Math.exp( (point["x"]*(point["x"]< 0 ? -1 : 1))/100)-dayLogOffset

      point["y"] = point["y"]/yscale;

      var now = new Date();
      var expire = new Date();
      expire.setDate(now.getDate()+point["x"]);
      document.getElementById("raytrace").innerHTML = expire.toLocaleDateString("en-US")+ "<br> " + "<strong>Strike:</strong> " +point["y"].toFixed(2) + "<br> <strong>IV: </strong>"  + point["z"].toFixed(2);

     }
    scene.add(surface);


    // GRIDS



    // Time gridHelper
    for (var i = 0; i < surfaceState["daysIndex"].length; i++) {
      let x =  Math.log((dayLogOffset+Number(surfaceState["daysIndex"][i])))*100 * (callsputs01 == 0 ? 1 : -1);
      var geometry = new THREE.Geometry();
      geometry.vertices.push(new THREE.Vector3( x,0,-1));
      geometry.vertices.push(new THREE.Vector3( x, (25+ yscale*Number(surfaceState["strikesIndex"][surfaceState["strikesIndex"].length-1])),-1));

      var line = new THREE.Line(geometry, new THREE.LineBasicMaterial({}));
      line.translateX(xOffset* (callsputs01 == 0 ? 1 : -1))

      let text= makeTextSprite(surfaceState["daysIndex"][i]);
      text.position.x=x
      text.position.y=-25
      text.translateX(xOffset* (callsputs01 == 0 ? 1 : -1)+30)

      scene.add( line );
      scene.add( text );
    }


    // Strike gridHelper
    let lastY=0;
    for (var i = 0; i < surfaceState["strikesIndex"].length; i++) {
      let xMax =  Math.log((dayLogOffset+Number(surfaceState["daysIndex"][surfaceState["daysIndex"].length-1])))*100 * (callsputs01 == 0 ? 1 : -1)+25* (callsputs01 == 0 ? 1 : -1);
      var geometry = new THREE.Geometry();
      geometry.vertices.push(new THREE.Vector3( -25*(callsputs01 == 0 ? 1 : -1),surfaceState["strikesIndex"][i]*yscale ,-1));
      geometry.vertices.push(new THREE.Vector3( xMax, surfaceState["strikesIndex"][i]*yscale ,-1  ));
      var line = new THREE.Line(geometry, new THREE.LineBasicMaterial({}));
      line.translateX(xOffset* (callsputs01 == 0 ? 1 : -1))

      scene.add( line );

      // Only add intermittant text
      if (surfaceState["strikesIndex"][i]*yscale- lastY < 25) {
        continue;
      }

        lastY=surfaceState["strikesIndex"][i]*yscale
      let text= makeTextSprite(surfaceState["strikesIndex"][i]);
      text.position.x=xMax+50* (callsputs01 == 0 ? 1 : -1)
      text.position.y=surfaceState["strikesIndex"][i]*yscale
      text.translateX(xOffset* (callsputs01 == 0 ? 1 : -1)+30)

      scene.add( line );
      scene.add( text );
    }
}


function makeTextSprite( message, parameters )
{
	if ( parameters === undefined ) parameters = {};

	var fontface = parameters.hasOwnProperty("fontface") ?
		parameters["fontface"] : "Consolas";

	var fontsize = parameters.hasOwnProperty("fontsize") ?
		parameters["fontsize"] : 36;

	var borderThickness = parameters.hasOwnProperty("borderThickness") ?
		parameters["borderThickness"] : 4;

	var borderColor = parameters.hasOwnProperty("borderColor") ?
		parameters["borderColor"] : { r:0, g:0, b:0, a:1.0 };

	var backgroundColor = parameters.hasOwnProperty("backgroundColor") ?
		parameters["backgroundColor"] : { r:0, g:0, b:0, a:1.0 };

	//var spriteAlignment = parameters.hasOwnProperty("alignment") ?

	var canvas = document.createElement('canvas');
	var context = canvas.getContext('2d');
	context.font = fontsize + "px " + fontface;

	// get size data (height depends only on font size)
	var metrics = context.measureText( message );
	var textWidth = metrics.width;


	// 1.4 is extra height factor for text below baseline: g,j,p,q.


	// 1.4 is extra height factor for text below baseline: g,j,p,q.

	// text color
	context.fillStyle = "rgba(255, 255, 255, 1.0)";

	context.fillText( message, borderThickness, fontsize + borderThickness);

	// canvas contents will be used for a texture
	var texture = new THREE.Texture(canvas)
	texture.needsUpdate = true;

	var spriteMaterial = new THREE.SpriteMaterial(
		{ map: texture} );
	var sprite = new THREE.Sprite( spriteMaterial );
	sprite.scale.set(100,50,1.0);
	return sprite;
}


// function for drawing rounded rectangles
function roundRect(ctx, x, y, w, h, r)
{
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.lineTo(x+w-r, y);
    ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r);
    ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
    ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r);
    ctx.lineTo(x, y+r);
    ctx.quadraticCurveTo(x, y, x+r, y);
    ctx.closePath();
    ctx.fill();
	ctx.stroke();
}



// handle files imported from Ui
function fileImport(files) {
    if (window.FileReader) {
        var reader = new FileReader();
        reader.readAsText(files[0]);
        reader.onload = function (event) {
            var csvString = event.target.result;
            // Cheesy way to chop off first two lines
            var firstLine = csvString.substring(0, csvString.indexOf("\n")).split(",");
            var csvString = csvString.substring(csvString.indexOf("\n") + 1);
            var secondLine = csvString.substring(0, csvString.indexOf("\n")).split(",");
            var csvString = csvString.substring(csvString.indexOf("\n") + 1);
            var csvString = csvString.substring(csvString.indexOf("\n") + 1);

            //Set Description
            document.getElementById("info").innerHTML = "<h1> " + firstLine[0] + "</h1><br>" + secondLine;
            var csv = Papa.parse(csvString, {
                delimiter: "", // auto-detect
                newline: "", // auto-detect
                quoteChar: '',
                escapeChar: '',
                header: false,
                dynamicTyping: false,
                preview: 0,
                encoding: "",
                worker: false,
                comments: false,
                step: processRawItem,
                complete: processRawDataComplete,
                error: undefined,
                skipEmptyLines: false,
            })
        };
        reader.onerror = function errorHandler(evt) {
            alert("File Load Error");
            console.error(evt);
        }
    } else {
        alert('FileReader not supported in this browser.');
    }

}


function init() {
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, .1, 10000);

    camera.lookAt(7, 10, 20);
    camera.position.z = 1000;
    camera.position.x = 100;
    camera.position.y = 5;

    controls = new THREE.TrackballControls(camera);


    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.noZoom = false;
    controls.noPan = false;
    controls.staticMoving = true;
    controls.dynamicDampingFactor = 0.3;
    controls.keys = [65, 83, 68];

    controls.addEventListener('change', render);


    scene = new THREE.Scene();
    var light = new THREE.AmbientLight(0xDDDDDD); // soft white light
    scene.add(light);

    var directionalLight = new THREE.DirectionalLight( 0xCCCCCCC,0.5);
    scene.add( directionalLight );

    // Draw a little spher
    var sgeometry = new THREE.SphereGeometry( 5,16,16);
    var smaterial = new THREE.MeshBasicMaterial( {color: 0xFFFFFF} );
    surfaceState["clickSphere"] = new THREE.Mesh( sgeometry, smaterial );
    scene.add( surfaceState["clickSphere"] );


    geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    material = new THREE.MeshNormalMaterial();

    mesh = new THREE.Mesh(geometry, material);
    //scene.add( mesh );

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize, false);
    //
    render();
}


function animate() {

    requestAnimationFrame(animate);


    controls.update();
    renderer.render(scene, camera);

}

function render() {
    renderer.render(scene, camera);
}
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

function clickTrace( event ) {

    event.preventDefault();

    mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera );

    var intersects = raycaster.intersectObjects( surfaceState["surfaces"] );
    if ( intersects.length > 0 ) {

        intersects[0].object.callback(intersects[0]["point"]);
    }

}

document.addEventListener('mousemove', clickTrace, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    controls.handleResize();
    render();
}

function createUI() {
    var gui = new dat.GUI();

    gui.domElement.id = 'gui_css';
    gui.add(surfaceState.ui, 'addFile').name('Add File');
    gui.add(surfaceState.ui, 'calls');
    gui.add(surfaceState.ui, 'puts');
}
