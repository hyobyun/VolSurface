var camera, scene, renderer;
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
  "procData" : []
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
  drawCallsPuts();
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
function draw(callsputs01) {

  var points=[];
  for (var i = 0; i <   surfaceState["daysIndex"].length; i++) {
    for (var j = 0; j <   surfaceState["strikesIndex"].length; j++) {
          if(surfaceState["procData"][i][j] && !isNaN(surfaceState["procData"][i][j][callsputs01]     ))
          {
          	var point = new THREE.Vector3();
            vol=surfaceState["procData"][i][j][callsputs01]*100;
          	point.x = surfaceState["daysIndex"][i] ;
          	point.y = surfaceState["strikesIndex"][j] ;
          	point.z =  surfaceState["procData"][i][j][callsputs01] ;
          	points.push( point );



          var gradient = tinygradient([
           '#ff0000',
              '#00ff00',
          '#0000ff'
          ]);
          var color= gradient.reverse().hsvAt( Math.min(vol/100,1)).toHexString()
            //  console.log(color)
            var geometry = new THREE.SphereGeometry( 10, 4, 4 );
            var material = new THREE.MeshBasicMaterial( {color: color} );
            var sphere = new THREE.Mesh( geometry, material );
            console.log(callsputs01 + "  " +(callsputs01===0 ? 1:-1));
            sphere.position.set(surfaceState["daysIndex"][i] , surfaceState["strikesIndex"][j] ,  vol *(callsputs01==0 ? 1:-1));
            scene.add( sphere );
        }
    }
  }

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
      csvString = csvString.substring(csvString.indexOf("\n") + 1);
      csvString = csvString.substring(csvString.indexOf("\n") + 1);
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
    camera.position.x = 5;
    camera.position.y = 5;

    var controls = new THREE.OrbitControls( camera );

    controls.update();

    function animate() {

    	requestAnimationFrame( animate );

    	// required if controls.enableDamping or controls.autoRotate are set to true
    	controls.update();

    	renderer.render( scene, camera );

    }

	scene = new THREE.Scene();

	geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
	material = new THREE.MeshNormalMaterial();

	mesh = new THREE.Mesh( geometry, material );
	//scene.add( mesh );

	renderer = new THREE.WebGLRenderer( { antialias: true } );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

}

function animate() {

	requestAnimationFrame( animate );

	mesh.rotation.x += 0.01;
	mesh.rotation.y += 0.02;

	renderer.render( scene, camera );

}

function createUI() {
  var gui = new dat.GUI();

  gui.add(surfaceState.ui, 'addFile').name('Add File');
  gui.add(surfaceState.ui, 'calls');
  gui.add(surfaceState.ui, 'puts');
}
