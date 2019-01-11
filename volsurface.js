var camera, scene, renderer;
var geometry, material, mesh;

var surfaceState={
  'ui': {
    "addFile" :function(){
      document.getElementById('csvInput').click();
    },
    "calls" :true,
    "puts"  : true
  },
  // t+:srike:price
  "rawData" :{},
  "allStrikes" : {},

  "daysIndex" :[],
  "strikesIndex" :[],
  "procData" : []
};

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
  var days= parseInt(dateDiffInDays( new Date(item["data"][0]["Expiration Date"])));
  var strike=Number(item["data"][0]["Strike"]);
  var iv= item["data"][0]["IV"];

  if(! (days in surfaceState["rawData"]) ) {
    surfaceState["rawData"][days]={};
  }
  if(! (strike in surfaceState["rawData"][days]) ) {
    surfaceState["rawData"][days][strike]={};
  }
  if(! (strike in surfaceState["allStrikes"]) ) {
    surfaceState["allStrikes"][strike]=1;
  }
  surfaceState["rawData"][days][strike]=iv*100;
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
  draw();
  console.log(  surfaceState["procData"]);
}
function draw() {

  var starsGeometry = new THREE.Geometry();

  for (var i = 0; i <   surfaceState["daysIndex"].length; i++) {
    for (var j = 0; j <   surfaceState["strikesIndex"].length; j++) {

          if(!isNaN(surfaceState["procData"][i][j]))
          {
          	var star = new THREE.Vector3();
          	star.x = surfaceState["daysIndex"][i] ;
          	star.y = surfaceState["strikesIndex"][j] ;
          	star.z =  surfaceState["procData"][i][j] ;

          	starsGeometry.vertices.push( star );



              var gradient = tinygradient([
               '#ff0000',
                  '#00ff00',
              '#0000ff'
              ]);
              var color= gradient.hsvAt( Math.min(surfaceState["procData"][i][j]/100,1)).toHexString()
              console.log(color)
            var geometry = new THREE.SphereGeometry( 1, 4, 4 );
            var material = new THREE.MeshBasicMaterial( {color: color} );
            var sphere = new THREE.Mesh( geometry, material );
            sphere.position.set(surfaceState["daysIndex"][i] , surfaceState["strikesIndex"][j] , surfaceState["procData"][i][j] );
            scene.add( sphere );
        }
    }
  }

  var starsMaterial = new THREE.PointsMaterial( { color: 0xFFFFFF } );

  var starField = new THREE.Points( starsGeometry, starsMaterial );

  scene.add( starField );
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
      	header: true,
      	transformHeader: undefined,
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
    camera.position.z = 100;
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

  gui.add(surfaceState.ui, 'addFile').name('AddFile');

  gui.add(surfaceState.ui, 'calls');
  gui.add(surfaceState.ui, 'puts');
}
