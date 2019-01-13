

var camera, scene, renderer,controls;
var geometry, material, mesh;

var surfaceState={
  'ui': {
    "addFile" :function(){
                document.getElementById('csvInput').click();
              },
    'calls' : true,
    'puts'  : true
  },
  // t+:srike:price
  "rawData" :{},
  "allStrikes" : {},
  "daysIndex" :[],
  "strikesIndex" :[],
  "procData" : [],
  "callsFn" :[],
  "putsFn" : [],
};
var headeri = {
 "Expiration Date": 0,
  "Strike": 11,
  "Call IV" : 7,
  "Put IV" : 8

}
init();
animate();
createUI();

function dateDiffInDays(a) {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  const utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  var b= new Date();
  const utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((utc1 - utc2) / _MS_PER_DAY);
}

function processRawItem(item) {
  //console.log(item);
  var days= parseInt(dateDiffInDays( new Date(item["data"][0][headeri["Expiration Date"]])));
  var strike=Number(item["data"][0][headeri["Strike"]]);   //
  var calliv= item["data"][0][headeri["Call IV"]];
  var putiv= item["data"][0][headeri["Put IV"]];

  if(! (days in surfaceState["rawData"]) ) {
    surfaceState["rawData"][days]={};
  }
  if(! (strike in surfaceState["rawData"][days]) ) {
    surfaceState["rawData"][days][strike]={};
  }
  if(! (strike in surfaceState["allStrikes"]) ) {
    surfaceState["allStrikes"][strike]=1;
  }
  surfaceState["rawData"][days][strike]=[calliv,putiv];
}


function processRawDataComplete() {
  surfaceState["daysIndex"]= Object.keys(surfaceState["rawData"]).sort(function(a, b){return a-b});
  surfaceState["strikesIndex"]=Object.keys(surfaceState["allStrikes"]).sort(function(a, b){return a-b});
  for (var i = 0; i <   surfaceState["daysIndex"].length; i++) {
    surfaceState["procData"][i]=[];
    for (var j = 0; j <   surfaceState["strikesIndex"].length; j++) {
      surfaceState["procData"][i][j]=surfaceState["rawData"][surfaceState["daysIndex"][i]][surfaceState["strikesIndex"][j]];
      }
  }
  console.log(surfaceState["procData"])
  interpolate();
  drawCallsPuts();
}

function interpolate() {
  // This interpolation method sucks
  for (var i = 0; i <   surfaceState["daysIndex"].length; i++) {
    var lastGoodVolCall=0;
    var lastGoodVolPut=0;
    for (var j = 0; j <   surfaceState["strikesIndex"].length; j++) {
          if(!surfaceState["procData"][i][j]) {
            surfaceState["procData"][i][j]=[];
          }

          if(!isNaN(surfaceState["procData"][i][j][0]     ))
          {
            lastGoodVolCall=surfaceState["procData"][i][j][0];
          } else {
            surfaceState["procData"][i][j][0]=lastGoodVolCall;
          }

          if(!isNaN(surfaceState["procData"][i][j][1]     ))
          {
            lastGoodVolPut=surfaceState["procData"][i][j][1];
          } else {
            surfaceState["procData"][i][j][1]=lastGoodVolPut;
          }
    }
  }
}

function drawCallsPuts() {
  if(surfaceState.ui["calls"]) {
    draw(0)
  }
    console.log("PUTS: " +surfaceState.ui["puts"])
  if( surfaceState.ui["puts"]) {
    draw(1)
  }
}

function getTriangles(size,i,j) {
  var f1=(i+1)*size +j
  var f2=i*size +j+1
  var f3=(i+1)*size +j+1
  var f4=i*size+j

  return [f1,f2,f3,f4];
}
function draw(callsputs01) {
  var surfaceGeo = new THREE.Geometry();
  var surfaceGeoVertexVolLookup= [];


  var points=[];
  for (var i = 0; i <   surfaceState["daysIndex"].length; i++) {
    for (var j = 0; j <   surfaceState["strikesIndex"].length; j++) {
          if(surfaceState["procData"][i][j] && !isNaN(surfaceState["procData"][i][j][callsputs01]     )) {
            vol=surfaceState["procData"][i][j][callsputs01]*100;
          } else {
            vol=0;
          }

          var gradient = tinygradient([
           '#ff0000',
              '#00ff00',
          '#0000ff'
          ]);
          var color= gradient.reverse().hsvAt( Math.min(vol/100,1)).toHexString()




          surfaceGeo.vertices.push(
          	new THREE.Vector3(surfaceState["daysIndex"][i] , surfaceState["strikesIndex"][j] ,  100*(callsputs01==0 ? 1:-1)+vol *(callsputs01==0 ? 1:-1)*2 )
          );
          surfaceGeoVertexVolLookup.push(vol);
          if (i<   surfaceState["daysIndex"].length -1 && j <   surfaceState["strikesIndex"].length-1) {
            var ts=getTriangles(surfaceState["strikesIndex"].length,i,j);
          //  console.log("  " + f1 +","  + f2 +"," + f3 +"," + f4 +",");
            var face1=new THREE.Face3( ts[0], ts[1],ts[2] );
            var face2=new THREE.Face3(ts[3], ts[0], ts[1]);
            surfaceGeo.faces.push(face1);
            surfaceGeo.faces.push(face2);
          }



            //  console.log(color)
            var geometry = new THREE.SphereGeometry( 10, 2, 2 );
            var material = new THREE.MeshBasicMaterial( {color: color} );
            var sphere = new THREE.Mesh( geometry, material );
            sphere.position.set(surfaceState["daysIndex"][i] , surfaceState["strikesIndex"][j] ,  10*(callsputs01==0 ? 1:-1)+vol *(callsputs01==0 ? 1:-1));
            //scene.add( sphere );
        }
    }

    // Color faces
    for (var i = 0; i < surfaceGeo.faces.length; i++) {
      var aveVol=(surfaceGeoVertexVolLookup[surfaceGeo.faces[i].a]+surfaceGeoVertexVolLookup[surfaceGeo.faces[i].b]+surfaceGeoVertexVolLookup[surfaceGeo.faces[i].c])/3;

      var colorhex = new THREE.Color( gradient.reverse().hsvAt( Math.min(aveVol/100,1)).toHexString() ); //optional
      surfaceGeo.faces[i].color=colorhex;

    }

              var geoMat = new THREE.MeshLambertMaterial( );

    surfaceGeo.computeFaceNormals();
surfaceGeo.computeVertexNormals();
    geoMat.side=THREE.DoubleSide;
    geoMat.vertexColors= THREE.FaceColors;
      var surface = new THREE.Mesh( surfaceGeo, geoMat );

     scene.add( surface );
}
// handle files imported from Ui
function fileImport(files) {
  console.log(files);
  if (window.FileReader) {
    var reader = new FileReader();
    reader.readAsText(files[0]);
    reader.onload = function(event) {
      var csvString = event.target.result;
      // Cheesy way to chop off first two lines
      var firstLine=  csvString.substring(0, csvString.indexOf("\n")).split(",");
      var csvString = csvString.substring(csvString.indexOf("\n") + 1);
      var secondLine=  csvString.substring(0, csvString.indexOf("\n")).split(",");
      var csvString = csvString.substring(csvString.indexOf("\n") + 1);
      var csvString = csvString.substring(csvString.indexOf("\n") + 1);

      //Set Description
      document.getElementById("info").innerHTML= "<h1> " + firstLine[0] + "</h1><br>" +  secondLine;
      var csv = Papa.parse(csvString, {
      	delimiter: "",	// auto-detect
      	newline: "",	// auto-detect
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
	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight,  .1, 10000 );

    camera.lookAt(7,10,20);
    camera.position.z = 1000;
    camera.position.x = 100;
    camera.position.y = 5;

    controls = new THREE.TrackballControls( camera );


		controls.rotateSpeed = 1.0;
		controls.zoomSpeed = 1.2;
		controls.panSpeed = 0.8;
		controls.noZoom = false;
		controls.noPan = false;
		controls.staticMoving = true;
		controls.dynamicDampingFactor = 0.3;
		controls.keys = [ 65, 83, 68 ];

    				controls.addEventListener( 'change', render );



	scene = new THREE.Scene();
  var light = new THREE.AmbientLight( 0xEEEEEE ); // soft white light
  scene.add( light );
	geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
	material = new THREE.MeshNormalMaterial();

	mesh = new THREE.Mesh( geometry, material );
	//scene.add( mesh );

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	window.addEventListener( 'resize', onWindowResize, false );
	//
	render();
}

function animate() {

	requestAnimationFrame( animate );


	controls.update();
	renderer.render( scene, camera );

}

function render() {
	renderer.render( scene, camera );
}
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
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
