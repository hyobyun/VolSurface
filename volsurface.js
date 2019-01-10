var camera, scene, renderer;
var geometry, material, mesh;

var surfaceState={
  'ui': {
    "addFile" :function(){
      document.getElementById('csvInput').click();
    },
    "calls" :true,
    "puts"  : true
  }
};

init();
animate();
createUI();

// handle files imported from Ui
function fileImport(files) {
  console.log(files);
  if (window.FileReader) {
    var reader = new FileReader();
    reader.readAsText(files[0]);
    reader.onload = function(event) {
      var csv = event.target.result;
      console.log(csv);
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

	camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 10 );
	camera.position.z = 1;

	scene = new THREE.Scene();

	geometry = new THREE.BoxGeometry( 0.2, 0.2, 0.2 );
	material = new THREE.MeshNormalMaterial();

	mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );

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
