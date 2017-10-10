require('./dependencies')

var renderer = createRenderer();
var scene = new THREE.Scene();
var camera = createCamera();
var editorControls = createEditorControls();
var transformControls = createTransformControls();

window.listeners = {
    rotation: null,
    scale: null,
    position: null
};

createSky();
grid(100);
onWindowResize();

window.load = function (path, scale, rotation, position) {
    window.collada && scene.remove(window.collada);
    var loader = new THREE.ColladaLoader();
    loader.options.convertUpAxis = true;
    loader.load(path, function (loaded) {
        window.collada = loaded.scene;
        window.collada.updateMatrix();
        scene.add(window.collada);
        transformControls.attach(window.collada);
        scale && window.scale(scale);
        rotation && window.rotate(rotation[0], rotation[1], rotation[2]);
        position && window.translate(position[0], position[1], position[2]);
    });
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
        var scale = sprite.position.distanceTo(camera.position)/2;
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
    gridLabel(0, -size/2);
    gridLabel(0, size/2);
    gridLabel(-size/2, 0);
    gridLabel(size/2, 0);
    render();

    function gridLabel(x, z) {
        x && createText('x: ' + x, x*1.2, 0, z*1.2);
        z && createText('z: ' + z, x*1.2, 0, z*1.2);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

var state = {
    scale: {x: 0, y: 0, z: 0},
    position: {x: 0, y: 0, z: 0},
    rotation: {x: 0, y: 0, z: 0}
};

function clampTo_0_360(v) {
    while (v > 360) v -= 360;
    while (v < 0) v += 360;
    return v;
}
function render() {
    window.gridHelper && window.gridHelper.sprites.forEach(function (sprite) {
        sprite.updateScale();
    });
    renderer.render(scene, camera);

    if (!window.collada)
        return;

    watch('rotation', 180/Math.PI, clampTo_0_360);
    watch('scale');
    watch('position');
}

function watch(propertyName, factor, transformFunction) {
    factor = factor || 1;
    var p = state[propertyName];
    var dp = window.collada[propertyName];
    var l = window.listeners[propertyName];
    var f = transformFunction || function f(a){return a}
    if (!eq(p, dp, factor)) {
        p.x = dp.x * factor;
        p.y = dp.y * factor;
        p.z = dp.z * factor;
        l && l(f(p.x), f(p.y), f(p.z));
    }

}
function eq(o1, o2, factor) {
    factor = factor || 1;
    return o1.x === o2.x * factor
        && o1.y === o2.y * factor
        && o1.z === o2.z * factor
}