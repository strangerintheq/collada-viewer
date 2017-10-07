require('./dependencies')

var renderer = createRenderer();
var scene = new THREE.Scene();
var camera = createCamera();
var editorControls = createEditorControls();
var transformControls = createTransformControls();

createSky();
grid(100);
onWindowResize();

window.load = function (path) {
    window.collada && scene.remove(window.collada);
    var loader = new THREE.ColladaLoader();
    loader.options.convertUpAxis = true;
    loader.load(path, function (loaded) {
        window.collada = loaded.scene;
        window.collada.updateMatrix();
        scene.add(window.collada);
        transformControls.attach(window.collada);
        scale(1);
    } );
};

window.scale = function (scale) {
    if (!window.collada) return;
    window.collada.scale.x =
        window.collada.scale.y =
            window.collada.scale.z = scale;
    setTimeout(render, 100);
};

window.translate = function (x, y, z) {
    if (!window.collada) return;
    window.collada.position.x = x;
    window.collada.position.y = y;
    window.collada.position.z = z;
    setTimeout(render, 100);
};

window.rotate = function (x,y,z) {
    if (!window.collada) return;
    window.collada.rotation.x = x/180*Math.PI;
    window.collada.rotation.y = y/180*Math.PI;
    window.collada.rotation.z = z/180*Math.PI;
    setTimeout(render, 100);
};

window.state = function () {
    var c = window.collada;
    if (!c) return;
    return {
        scale: c.scale.x,
        position: {
            x: c.position.x,
            y: c.position.y,
            z: c.position.z
        },
        rotation: {
            x: c.rotation.x,
            y: c.rotation.y,
            z: c.rotation.z
        }
    };
};

window.grid = grid;

window.addEventListener('mouseup', function (e) {
    if (e.button < 2) return;
    if (transformControls.getMode() === "scale") {
        transformControls.setMode("rotate")
    } else if (transformControls.getMode() === "rotate") {
        transformControls.setMode("translate")
    } else {
        transformControls.setMode("scale")
    }
    render();
});

function createCamera() {
    var camera = new THREE.PerspectiveCamera(60, 1, 1, 1e10);
    camera.position.set(100, 100, 100);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    return camera;
}

function createRenderer() {
    var renderer = new THREE.WebGLRenderer({antialias: true});
    window.addEventListener('resize', onWindowResize, false);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);
    return renderer;
}

function createSky() {

    var sky = new THREE.Sky();
    scene.add(sky.mesh);

    var sun = {
        inclination: 0.49,
        azimuth: 0.25,
        color: 0xffffff
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

    var directionalLight = new THREE.DirectionalLight(sun.color, 0.7);
    directionalLight.position.copy(position);
    scene.add(directionalLight);

    scene.add(new THREE.AmbientLight(sun.color, 0.3));
}

function createEditorControls() {
    var editorControls = new THREE.EditorControls(camera, renderer.domElement);
    editorControls.addEventListener('change', function () {
        transformControls.update();
        render();
    });
    editorControls.panSpeed = 0;
    return editorControls;
}

function createTransformControls() {
    var transformControls = new THREE.TransformControls(camera, renderer.domElement);
    transformControls.addEventListener('change', render);
    transformControls.addEventListener('mouseDown', function () {
        editorControls.enabled = false;
    });
    transformControls.addEventListener('mouseUp', function () {
        editorControls.enabled = true;
    });
    scene.add(transformControls);
    return transformControls;
}

function createText(text, x, y, z) {
    var canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    var ctx = canvas.getContext('2d');
    ctx.font = "22px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(text, canvas.width/2, canvas.height/2);

    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    var sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: texture
    }));
    sprite.position.set(x, y, z);
    sprite.updateScale = function () {
        var scale = sprite.position.distanceTo(camera.position) / 4;
        sprite.scale.set(scale, scale, scale);
    };
    window.gridHelper.add(sprite);
    window.gridHelper.sprites.push(sprite);
}

function grid(size) {
    window.gridHelper && scene.remove(gridHelper);
    window.gridHelper = new THREE.GridHelper(size, 10, 0xffffff, 0xffffff);
    window.gridHelper.sprites = [];
    scene.add(window.gridHelper);
    gridLabel(-size/2, -size/2);
    gridLabel(-size/2, size/2);
    gridLabel(size/2, -size/2);
    gridLabel(size/2, size/2);
    render();
    function gridLabel(x, z) {
        createText('x: ' + x + ' z: ' + z, x, 0, z);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

function render() {
    window.gridHelper && window.gridHelper.sprites.forEach(function (sprite) {
        sprite.updateScale();
    });
    renderer.render(scene, camera);
}
