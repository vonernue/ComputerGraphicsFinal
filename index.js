import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let camera, controls, cameraTPP, controlsTPP, scene, renderer;
let player, helmet, monitor, video; 
let geometry, material

const loader = new GLTFLoader();
const mouse = new THREE.Vector2();
const target = new THREE.Vector2();
const windowHalf = new THREE.Vector2( window.innerWidth / 2, window.innerHeight / 2 );

var zoomSpeed = 3;
var isTPP = false
var isPlaying = false;

main();
animate();

function main() {
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    cameraTPP = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.z = 10;
    
    scene = new THREE.Scene();

    var env = new THREE.CubeTextureLoader()
        .setPath( 'envCube/' )
        .load( [
            'px.png',
            'nx.png',
            'py.png',
            'ny.png',
            'pz.png',
            'nz.png'
        ] );
    
    env.mapping = THREE.CubeRefractionMapping;
    scene.background = env;
    scene.environment = env;

    renderer = new THREE.WebGLRenderer();
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.75;
    renderer.shadowMap.enabled = true;
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );


    // Lights
    const light = new THREE.SpotLight( 0xffffff, 1.5 );
    light.position.set( 10, 20, 0 );
    light.angle = Math.PI * 0.2;
    light.castShadow = true;
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 1000;
    light.shadow.bias = - 0.000222;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;
    scene.add( light );
   

    // FPP Orbit Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.listenToKeyEvents( window );
    controls.enablePan = false;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.zoomSpeed = zoomSpeed;

    const updateCameraOrbit = () => {
        var currentCamera = isTPP ? cameraTPP : camera;
        const forward = new THREE.Vector3();
        currentCamera.getWorldDirection(forward);
    
        controls.target.copy(currentCamera.position).add(forward);
    };
      
    controls.addEventListener('end', () => {
        updateCameraOrbit();
    });
      
    updateCameraOrbit();

    // TPP Orbit Controls ( User Control Locked, Enable AutoRotate )
    controlsTPP = new OrbitControls(cameraTPP, renderer.domElement);
    controlsTPP.listenToKeyEvents( window );
    controlsTPP.enabled = false;
    controlsTPP.autoRotate = true;
    controlsTPP.enableDamping = true;
    controlsTPP.dampingFactor = 0.05;
    controlsTPP.target = camera.position;

    // Load Video
    video = document.getElementById( 'vid' );
    // video.play();
    const vidTexture = new THREE.VideoTexture( video );

    // Cube
    geometry = new THREE.BoxGeometry( 1, 1, 1 );
    material = new THREE.MeshStandardMaterial(  {
        roughness: 0.5,
        metalness: 0
    });
    const cube = new THREE.Mesh( geometry, material );
    cube.castShadow = true;
    scene.add( cube );


    // Load Player
    loader.setPath('rickastley/')
    loader.load( 'scene.gltf',
        function ( gltf ) {
            player = gltf.scene;
            player.traverse( function ( n ) {
                if ( n.isMesh ) {
                    n.castShadow = true;
                    n.receiveShadow = true;
                }  
            })
            player.scale.set(0.2, 0.2, 0.2);
            player.setRotationFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
            player.position.copy(camera.position);
            player.position.y -= 10;
            scene.add( player );


            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Group
            gltf.scenes; // Array<THREE.Group>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object
        },
        // called while loading is progressing
        function ( xhr ) {
            console.log( 'Player: ' + ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        },
        // called when loading has errors
        function ( error ) {
            console.log( 'Error loading Player' );
        }
    );

    // Load Helmet
    loader.setPath('helmet/')
    loader.load( 'DamagedHelmet.gltf',
        function ( gltf ) { 
            helmet = gltf.scene;
            helmet.traverse( function ( n ) {
                if ( n.isMesh ) {
                    n.castShadow = true;
                    n.receiveShadow = true;
                }  
            })
            
            helmet.scale.set(2, 2, 2);
            helmet.position.set(2, -3, -3)
            helmet.castShadow = true;
            scene.add( helmet );

            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Group
            gltf.scenes; // Array<THREE.Group>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object
        },
        // called while loading is progressing
        function ( xhr ) {
            console.log( 'Helmet: ' + ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        },
        // called when loading has errors
        function ( error ) {
            console.log( 'Error loading Helmet' );
        }
    );

    // Load Monitor
    loader.setPath('monitor/')
    loader.load( 'scene.gltf',
        function ( gltf ) { 
            monitor = gltf.scene;
            monitor.traverse( function ( n ) {
                if ( n.isMesh ) {
                    n.castShadow = true;
                    n.receiveShadow = true;
                }  
                if (n.material && n.material.name === 'RenderMonitor'){
                    n.material.map = vidTexture;
                }
            })
            
            monitor.position.set(-0.3, -10, -250)
            monitor.scale.set(0.1, 0.1, 0.1);
            
            scene.add( monitor );

            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Group
            gltf.scenes; // Array<THREE.Group>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object
        },
        // called while loading is progressing
        function ( xhr ) {
            console.log( 'Monitor: ' + ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        },
        // called when loading has errors
        function ( error ) {
            console.log( 'Error loading Monitor' );
        }
    );



    geometry = new THREE.PlaneGeometry( 2000, 2000 );
    geometry.rotateX( - Math.PI / 2 );

    material = new THREE.ShadowMaterial();
    material.color = 0x000000;
    material.opacity = 0.20;
    // material.transparent = false;
    
    const plane = new THREE.Mesh( geometry, material );
    plane.position.y = -30;
    plane.receiveShadow = true;
    scene.add( plane );

    // const helper = new THREE.GridHelper( 100, 100 );
    // helper.position.y = -29;
    // helper.material.opacity = 0.1;
    // // helper.material.transparent = true;
    // scene.add( helper );

    window.addEventListener( 'resize', onResize, false );
    window.addEventListener( 'keydown', onKeyDown, false );
}

function onResize( ev ) {
	const width = window.innerWidth;
	const height = window.innerHeight;
    windowHalf.set( width / 2, height / 2 );
        
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    cameraTPP.aspect = width / height;
    cameraTPP.updateProjectionMatrix();
    renderer.setSize( width, height );
}

function onKeyDown( ev ) {
    if (ev.key == 't') {
        isTPP = !isTPP
        if (isTPP) {
            cameraTPP.position.x = camera.position.x;
            cameraTPP.position.y = 10;
            cameraTPP.position.z = camera.position.z + 20;
            cameraTPP.target = camera.position;
            cameraTPP.lookAt(camera.position)
        }
    } else if (ev.key == "Enter"){
        isPlaying = !isPlaying
        if(isPlaying){
            video.play()
        }else{
            video.pause()
        }
    }
}

function animate() {
    requestAnimationFrame( animate );

    if (isTPP){
        scene.add(player)
        controls.enabled = false
    }else{
        scene.remove(player)
        controls.enabled = true
    }

    if (player != undefined) {
        player.position.copy(camera.position);
        player.position.y -= 15;
    }

    // console.log(camera)


    controlsTPP.update()
    controls.update();

    if (isTPP) {
        renderer.render( scene, cameraTPP );
    } else {
        renderer.render( scene, camera );
    }
}

// animate();