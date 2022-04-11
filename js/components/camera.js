import * as THREE from "../../libs/three.js/build/three.module.js";

class Camera {
  constructor(sketch, settings) {
    this.sketch = sketch;
    this.settings = { ...settings };

    this.camera = new THREE.PerspectiveCamera(
      75,
      this.sketch.sizes.width / this.sketch.sizes.height,
      0.01,
      20
    );
    this.camera.position.x = 5;
    this.camera.position.y = 2.7;
    this.camera.position.z = 0;
    this.sketch.scene.add(this.camera);

    return this.camera;
  }
}
export default Camera;
