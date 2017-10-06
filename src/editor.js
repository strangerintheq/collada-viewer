var camera, scene, renderer;
var editorControls, transformControls, grid;

init();
render();

window.loadModel = function (spacecraft) {
    var loader = new THREE.ColladaLoader();
    loader.options.convertUpAxis = true;
    loader.load(spacecraft.model, function (collada) {
        var dae = collada.scene;
        dae.scale.x = dae.scale.y = dae.scale.z = 1;
        dae.updateMatrix();
        scene.add(dae);
        transformControls.attach(dae);
        render();
    } );
};

function init() {
    window.addEventListener('resize', onWindowResize, false);
    initRenderer();
    initScene();
    initEditorControls();
    initTransformControls();
    initSky();
}

function initScene() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000000);
    camera.position.set(0, 10, 50);

    grid = new THREE.GridHelper(10, 10, 0xffffff, 0xffffff);
    scene.add(grid);

    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
}

function initRenderer() {
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
}

function initSky() {

    var sky = new THREE.Sky();
    scene.add(sky.mesh);

    var sun = {
        inclination: 0.49,
        azimuth: 0.25
    };

    var uniforms = sky.uniforms;
    uniforms.turbidity.value = 10;
    uniforms.rayleigh.value = 2;
    uniforms.luminance.value = 1;
    uniforms.mieCoefficient.value = 0.005;
    uniforms.mieDirectionalG.value = 0.8;

    var distance = 800000;
    var theta = Math.PI * ( sun.inclination - 0.5 );
    var phi = 2 * Math.PI * ( sun.azimuth - 0.5 );

    var position = new THREE.Vector3();
    position.x = distance * Math.cos(phi);
    position.y = distance * Math.sin(phi) * Math.sin(theta);
    position.z = distance * Math.sin(phi) * Math.cos(theta);

    sky.uniforms.sunPosition.value.copy(position);
    var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.copy(position);
    scene.add(directionalLight);
}

function initEditorControls() {
    editorControls = new THREE.EditorControls(camera, renderer.domElement);
    editorControls.addEventListener('change', function () {
        transformControls.update();
        render();
    });
    editorControls.maxPolarAngle = Math.PI / 2;
    editorControls.enableZoom = true;
    editorControls.enablePan = true;
    return editorControls;
}

function initTransformControls() {
    transformControls = new THREE.TransformControls(camera, renderer.domElement);
    transformControls.addEventListener('change', render);
    transformControls.addEventListener('mouseDown', function () {
        editorControls.enabled = false;
    });
    transformControls.addEventListener('mouseUp', function () {
        editorControls.enabled = true;
    });
    scene.add(transformControls);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

function render() {
    renderer.render(scene, camera);
}
