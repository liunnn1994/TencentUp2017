---
title: 腾讯UP2017 3D粒子效果在网页端实现
categories: javascript
tags:
- threejs
- tweenjs
- 腾讯up互动娱乐
- 3D
---

# 腾讯UP2017 3D粒子效果在网页端实现

这段时间加班累成狗，终于尾声了，水一篇提升一下百度活跃度。

点击 [预览](https://up.qq.com/act/a20170301pre/index.html) 先看一下效果。

<!--more-->

## 获取模型

使用常规的3D建模软件即可。拿到3D模型之后再进行处理，处理的软件使用的是[Blender](https://www.blender.org/download/)兼容性比较好的是fbx格式，然后通过给Blender安装插件之后，将模型转换为便于three.js读取的JSON格式。当然我并不会建模，所以直接从[UP2017腾讯互动娱乐年度发布会 - 腾讯互动娱乐](https://up.qq.com/act/a20170301pre/index.html) 上直接把粒子模型“偷”下来：

![json模型](https://liunian-blog.oss-cn-beijing.aliyuncs.com/blog/20190108163103-Ha7htzYFdc.jpg)

## 初始工作

首先，初始化 threejs 三大元素：场景，相机，渲染器。我们需要一个用于切换的载体粒子体系和多个环境粒子体系（为了简单，在这只初始化了一个上下转动的环境粒子体系）。

```javascript
camera = new THREE.PerspectiveCamera(105, window.innerWidth / window.innerHeight, 300, 10000);
camera.position.z = 750;
// 初始化场景
scene = new THREE.Scene();
//雾化
scene.fog = new THREE.FogExp2(0x05050c, 0.0005);
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
// 圆点
const mapDot = textureLoader.load('assets/gradient.png');  
```



初始化载体粒子体系：载体粒子体系的粒子数量要比所有模型的顶点数量的最大值还要大，这样才能保证切换到每一个模型，都不会出现缺失的情况，而多余的点呢就让他们从头开始重叠好了。当然不是越多越好，我的电脑是MBP2018，20000的时候就开始力不从心了，30000直接无响应

```javascript
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
```

将获取到的 3D 模型，通过 JSONLoader 加载后，得到的 geometry 对象放入一个数组 glist 中，用于模型切换。



加载模型 loadObject：

新版的[threejs](https://github.com/mrdoob/three.js/)在`r98 → r99`的时候废弃了`JSONLoader`,模型在网站也比较久了，`ObjectLoader`也不能加载，所以要么使用旧版的，要么单独下载`JSONLoader`。

## r98 → r99

- `WebGLRenderTarget.texture.generateMipmaps` is now set to `false` by default.
- There is a new (not backwards compatible) implementation for `SSAOShader` and `SSAOPass`.
- `JSONLoader` has been removed from core. It is now located in `examples/js/loaders/deprecated/LegacyJSONLoader.js`.
- Removed `Geometry` support from `ObjectLoader`. You have to include `LegacyJSONLoader` if you still want to load geometry data of type `Geometry`.
- Removed `Geometry` support from `SkinnedMesh`. Use `BufferGeometry` instead.
- Removed `SkinnedMesh.initBones()`. The `SkinnedMesh` constructor does not build the bone hierarchy anymore. You have to do this by yourself and then call [SkinnedMesh.bind()](https://threejs.org/docs/#api/en/objects/SkinnedMesh.bind) in order to bind the prepared skeleton.

在这引入最新的`three.min.js`和`LegacyJSONLoader`：

```html
<script src="./js/three.min.js"></script>
<script src="./js/LegacyJSONLoader.js"></script>
```

加载模型 loadObject：

```javascript
const loader = new THREE.LegacyJSONLoader();
loader.load('assets/qr.json', function (geo, materials) {
    geo.center();
    geo.normalize();

    geo.scale(800, 800, 800);
    glist.push(geo);
});
```

## 添加页面事件监听

1. 按住鼠标拖动，可以旋转场景中的粒子体系。
2. 滚动鼠标滚轮，切换模型。
3. 手机上点击页面切换模型。

```javascript
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
```



## 切换动画 

使用的[tweenjs](https://github.com/tweenjs/tween.js/)

```javascript
function tweenObj(index) {
    let ani = null;
    geometry.vertices.forEach(function (e, i, arr) {
        ani = new TWEEN.Tween(e);
        const length = glist[index].vertices.length;
        const o = glist[index].vertices[i % length];
        ani.to({
            x: o.x,
            y: o.y,
            z: o.z
        }, 1000).easing(TWEEN.Easing.Exponential.In).delay(400 * Math.random()).start();
    });
	//动画完成时的回调
    ani.onComplete(function (params) {
        canMouseMove = true;
        flag = false;
    });
};
```

使用`tween.delay(animationDuration*Math.random());`是动画不那么生硬。

## 最后

渲染整个画面：

````javascript
function render() {
    around.rotateX(Math.PI / 1000);
    TWEEN.update();
    camera.lookAt(scene.position);
    geometry.verticesNeedUpdate = true;
    geometry.colorsNeedUpdate = true;
    renderer.render(scene, camera);
};
````

`TWEEN.update()`和` geometry.verticesNeedUpdate = true `共同决定了粒子体系切换动画可以展示出来。

[GitHub地址](https://github.com/asdjgfr/TencentUp2017)

## 总结

还有很多地方不完善：

1. 切换时旋转画面会导致粒子位置计算错误，撕裂模型，暂时在切换时禁止了旋转事件。

2. 雾化的位置和原版有很大差异，原版使用了三方的`composer`，这里用的是[alteredq](https://alteredqualia.com/)的一系列`EffectComposer`，包括过亮效果、暗角、电视效果等。

3. `KV`的动画没有实现裙边的效果。

4. 二维码的材质还是点，所以扫不出来，可以把材质的`map`设置为`null`即可是方形（没有纹理默认方形）。

   ```javascript
   new THREE.PointsMaterial({
       ...
       map: null, //texture
       ...
   });
   ```

5. 流畅度方面，使用`vertex shader`性能可能更好，感觉好高深，等大神踩踩坑。

