import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
import * as TWEEN from './js/tween.esm.js';

let camera, controls, cameraTPP, controlsTPP, cubeCamera, cubeRenderTarget, scene, renderer;
let player, helmet, monitor, bottle, video, meshShape, sphere; 
let geometry, material, sphereMat
let currentCamera;
let playerPos = new THREE.Vector3(0, 0, 0);
let inAnimation = false;
let stats;

const loader = new GLTFLoader();
const mouse = new THREE.Vector2();
const target = new THREE.Vector2();
const windowHalf = new THREE.Vector2( window.innerWidth / 2, window.innerHeight / 2 );

var zoomSpeed = 3;
var isTPP = false
var isPlaying = false;
var meshRoughness = 0.25

main();
animate();

function main() {
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.75;
    renderer.shadowMap.enabled = true;
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    stats = new Stats();
    document.body.appendChild( stats.dom );
    const gui = new GUI();
    const sceneFolder = gui.addFolder( 'Scene' );
    sceneFolder.add( renderer, 'toneMappingExposure', 0, 2 ).name( 'exposure' );

    camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    cameraTPP = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    camera.position.z = 10;
    currentCamera = camera;

    var env = new THREE.CubeTextureLoader()
    .setPath( 'envCube/' )
    .load( [
        'px.png',
        'nx.png',
        'py.png',
        'ny.png',
        'pz.png',
        'nz.png'
    ])

    env.mapping = THREE.CubeRefractionMapping
    scene = new THREE.Scene();
    // scene.rotation.y = 0.5;
    scene.background = env;
    scene.environment = env;

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
        var currentCamera = camera;
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
    // scene.add( cube );

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
            // scene.add( player );


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

    // Load Water Bottle
    loader.setPath('bottle/')
    loader.load( 'WaterBottle.gltf',
        function ( gltf ) { 
            bottle = gltf.scene;
            bottle.traverse( function ( n ) {
                if ( n.isMesh ) {
                    n.castShadow = true;
                    n.receiveShadow = true;
                }  
            })
            
            bottle.scale.set(7, 7, 7);
            bottle.position.set(-2, -5, -6)
            scene.add( bottle );

            gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Group
            gltf.scenes; // Array<THREE.Group>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object
        },
        // called while loading is progressing
        function ( xhr ) {
            console.log( 'Bottle: ' + ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
        },
        // called when loading has errors
        function ( error ) {
            console.log( 'Error loading Bottle' );
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

    // Weird Shape :>
    geometry = new THREE.IcosahedronGeometry(1, 0);
    material = new THREE.MeshPhysicalMaterial({  
        roughness: 0.25,  
        transmission: 1, // Add transparency
        thickness: 0.5, // Add Refraction
    });
    const bumpTexture = new THREE.TextureLoader().load('img/concreteNormal.jpg')
    material.bumpMap = bumpTexture
    material.bumpScale = 0.015
    const shapeFolder = gui.addFolder( 'Shape' )
    shapeFolder.add( material, 'roughness', 0, 1 );
    shapeFolder.add( material, 'metalness', 0, 1 );

    meshShape = new THREE.Mesh(geometry, material)
    meshShape.castShadow = true;
    meshShape.scale.set(2, 2, 2);
    meshShape.position.set(0, 0, -10)
    scene.add(meshShape);

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

    // cubeRenderTarget = new THREE.WebGLCubeRenderTarget( 128 );
    // cubeRenderTarget.texture.type = THREE.HalfFloatType
    // cubeCamera = new THREE.CubeCamera( 0.1, 1000, cubeRenderTarget );
    // cubeCamera.position.set(0, 0, 30);
    
    // // scene.add(cubeCamera)
    // cubeRenderTarget.texture.mapping = THREE.CubeRefractionMapping
    // material = new THREE.MeshStandardMaterial( {
    //     envMap: cubeRenderTarget.texture,
    //     roughness: 0.03,
    //     metalness: 1
    // } );
    // sphere = new THREE.Mesh( new THREE.IcosahedronGeometry( 5, 15 ), material );
    // sphere.position.set(0, 0, 30);
    // scene.add( sphere );

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
        if (inAnimation) return;
        isTPP = !isTPP
        if (isTPP) {
            playerPos = camera.position.clone()
            // scene.add(player)
            cameraTPP.position.x = camera.position.x;
            cameraTPP.position.y = 10;
            cameraTPP.position.z = camera.position.z + 20;
            cameraTPP.target = playerPos;
            cameraTPP.lookAt(playerPos)
            player.setRotationFromMatrix(camera.matrix);
            player.rotateY(Math.PI)
            
            controlsTPP.target = playerPos
            controlsTPP.autoRotate = false;
            controls.enabled = false
            // currentCamera = cameraTPP

            var FPPtoTPP = new TWEEN.Tween(camera.position)
                .to({x: camera.position.x, y: 10, z: camera.position.z+20}, 1500)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .onStart(function(){
                    controlsTPP.autoRotate = false;
                    controls.enabled = false
                    inAnimation = true
                })
                .onUpdate(function(){
                })
                .onComplete(function(){
                    scene.add(player)
                    controlsTPP.autoRotate = true;
                    currentCamera = cameraTPP
                    inAnimation = false
                })
                .start();
        }else{
            // scene.remove(player)
            // controls.enabled = true
            // currentCamera = camera
            console.log(playerPos.x, playerPos.y, playerPos.z)
            camera.position.copy(cameraTPP.position)
            var TPPtoFPP = new TWEEN.Tween(camera.position)
                .to({x: playerPos.x, y: playerPos.y, z: playerPos.z}, 1500)
                .easing(TWEEN.Easing.Quadratic.InOut)
                .onStart(function(){
                    scene.remove(player)
                    inAnimation = true
                    controlsTPP.autoRotate = false;
                    controls.enabled = true
                    currentCamera = camera
                })
                .onUpdate(function(){
                    
                })
                .onComplete(function(){
                    controls.enabled = true
                    inAnimation = false
                })
                .start();
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
    requestAnimationFrame(animate)

    if (player != undefined && !inAnimation) {
        if (isTPP) {
            player.position.copy(playerPos);
        }else{
            player.position.copy(camera.position);
        }
        
        // player.rotateY(camera.rotation.y);
        player.position.y -= 15;
    }

    // console.log(playerPos)

    meshShape.rotation.x += 0.01;
    meshShape.rotation.y += 0.01;

    // sphere.visable = false;
    // cubeCamera.update( renderer, scene );
    // sphere.visable = true
    // scene.add(sphere)
    controlsTPP.update()
    controls.update();
    TWEEN.update()

    renderer.render( scene, currentCamera );
    stats.update();
}

// animate();