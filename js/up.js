
let flag = false;//是否开始变换
let canMouseMove = true;//是否滑动滚轮
let [container, stats] = [document.createElement('div'), new Stats()];
let camera, scene, renderer, particles, geometry, material, glist = [];// glist 点阵数组
let around, aroundMaterial, aroundPoints;// 环境点组
let mouseX = 0, mouseY = 0;
let windowHalfX = window.innerWidth / 2;
let windowHalfY = window.innerHeight / 2;
let objIndex = 0;// 当前点阵模型index

//添加状态监控面板
container.appendChild(stats.dom);

init();
animate();

function init() {
  document.body.appendChild(container);
  // 初始化相机
  camera = new THREE.PerspectiveCamera(105, window.innerWidth / window.innerHeight, 300, 10000);
  camera.position.z = 750;
  // 初始化场景
  scene = new THREE.Scene();
  //雾化
  scene.fog = new THREE.FogExp2(0x999999, 0.00525);
  //初始化renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);
  // 初始化geometry
  geometry = new THREE.Geometry();
  around = new THREE.Geometry();
  // 初始化贴图
  const textureLoader = new THREE.TextureLoader();
  const mapDot = textureLoader.load('assets/gradient.png');  // 圆点


  //初始变换点组
  for (let i = 0; i < 15000; i++) {
    const vertex = new THREE.Vector3();
    vertex.x = 800 * Math.random() - 400;
    vertex.y = 800 * Math.random() - 400;
    vertex.z = 800 * Math.random() - 400;
    geometry.vertices.push(vertex);
    geometry.colors.push(new THREE.Color(255, 255, 255));
  }
  material = new THREE.PointsMaterial({ size: 4, sizeAttenuation: true, color: 0xffffff, transparent: true, opacity: 1, map: mapDot });

  material.vertexColors = THREE.VertexColors;
  particles = new THREE.Points(geometry, material);
  scene.add(particles);

  aroundMaterial = new THREE.PointsMaterial({ size: 1, sizeAttenuation: true, color: 0xffffff, transparent: true, opacity: 1, map: mapDot });

  aroundMaterial.vertexColors = THREE.VertexColors;
  aroundPoints = new THREE.Points(around, aroundMaterial);
  scene.add(aroundPoints);

  // 加载模型
  loadObject();

  //事件监听
  document.addEventListener('mousedown', onDocumentMouseDown, false);
  document.addEventListener("mousewheel", onDocumentMouseWheel, false);
  document.addEventListener("touchstart", onDocumentTouchStart, false);
  window.addEventListener('resize', onWindowResize, false);
}

function loadObject() {
  var loader = new THREE.LegacyJSONLoader();
  loader.load('assets/qr.json', function (geo, materials) {
    geo.center();
    geo.normalize();

    geo.scale(800, 800, 800);
    glist.push(geo);
  });
  loader.load('assets/cpac5.json', function (geo, materials) {
    geo.center();
    geo.normalize();

    geo.scale(600, 600, 600);
    glist.push(geo);
  });
  loader.load('assets/cpbook2.json', function (geo, materials) {
    geo.center();
    geo.normalize();

    geo.scale(600, 600, 600);
    glist.push(geo);
  });
  loader.load('assets/cpmovie4.json', function (geo, materials) {
    geo.center();
    geo.normalize();

    geo.scale(800, 800, 800);
    geo.rotateX(Math.PI / 2);
    glist.push(geo);
  });

  loader.load('assets/cpkv3.json', function (geo, materials) {
    geo.center();
    geo.normalize();
    geo.scale(800, 800, 800);
    geo.translate(0, -300, 0);
    glist.push(geo);
  });
}

function onDocumentMouseWheel(e) {
  canMouseMove = false;
  if (flag) {
    return false;
  };
  e.deltaY > 0 ? objIndex++ : objIndex--;
  if (objIndex > 4) {
    objIndex = 0;
  } else if (objIndex < 0) {
    objIndex = 4;
  };
  tweenObj(objIndex);
  flag = true;
};

function onDocumentTouchStart() {
  canMouseMove = false;
  if (flag) {
    return false;
  };
  objIndex++;
  if (objIndex > 4) {
    objIndex = 0;
  };
  tweenObj(objIndex);
  flag = true;
};

function tweenObj(index) {
  let ani = null;
  geometry.vertices.forEach(function (e, i, arr) {
    ani = new TWEEN.Tween(e);
    var length = glist[index].vertices.length;
    var o = glist[index].vertices[i % length];
    ani.to({
      x: o.x,
      y: o.y,
      z: o.z
    }, 1000).easing(TWEEN.Easing.Exponential.In).delay(400 * Math.random()).start();
  });

  ani.onComplete(function (params) {
    canMouseMove = true;
    flag = false;
  });
};

function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  windowHalfY = window.innerHeight / 2;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

function onDocumentMouseDown(event) {
  event.preventDefault();
  document.addEventListener('mousemove', onDocumentMouseMove, false);
  document.addEventListener('mouseup', onDocumentMouseUp, false);
  document.addEventListener('mouseout', onDocumentMouseOut, false);
  mouseX = event.pageX;
  mouseY = event.pageY;
};

function onDocumentMouseMove(event) {
  if (!canMouseMove) {
    return false;
  };
  geometry.rotateY((event.pageX - mouseX) / 2000 * 2 * Math.PI);
  geometry.rotateX((event.pageY - mouseY) / 2000 * 2 * Math.PI);
  event.preventDefault();
  mouseX = event.pageX;
  mouseY = event.pageY;
};

function onDocumentMouseUp(event) {//释放鼠标键  

  document.removeEventListener('mousemove', onDocumentMouseMove, false);
  document.removeEventListener('mouseup', onDocumentMouseUp, false);
  document.removeEventListener('mouseout', onDocumentMouseOut, false);
};

function onDocumentMouseOut(event) {//移走鼠标  

  document.removeEventListener('mousemove', onDocumentMouseMove, false);
  document.removeEventListener('mouseup', onDocumentMouseUp, false);
  document.removeEventListener('mouseout', onDocumentMouseOut, false);
};


function animate(time) {
  requestAnimationFrame(animate);
  render();
  stats.update();
};

function render() {
  around.rotateX(Math.PI / 1000);
  TWEEN.update();
  camera.lookAt(scene.position);
  geometry.verticesNeedUpdate = true;
  geometry.colorsNeedUpdate = true;
  renderer.render(scene, camera);
};