import * as THREE from 'three';

(function() {
  const earthAxialTilt = THREE.MathUtils.degToRad(23.43667);
  const sunAxialTilt = THREE.MathUtils.degToRad(7.25);

  const graphics = (function() {
    let scene, camera, earth, sun, renderer, sunLight, loaded = false;
    let isDragging = false, raycaster, mouse, orbitPlane, initialAngle;

    const loadingManager = new THREE.LoadingManager();
    loadingManager.onLoad = () => {
      loaded = true;
    };

    const earthRotationalAxis = new THREE.Vector3(0, earthAxialTilt, 0).normalize();
    const sunRotationalAxis = new THREE.Vector3(0, sunAxialTilt, 0).normalize();

    function init() {
      scene = new THREE.Scene();

      camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          1000,
      );

      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setClearColor(0x000000);

      document.body.appendChild(renderer.domElement);

      {
        const geometry = new THREE.SphereGeometry(100, 32, 32);
        const starsTexture = new THREE.TextureLoader(loadingManager).load(
            'textures/2k_stars.jpg',
        );
        const material = new THREE.MeshBasicMaterial({
          side: THREE.BackSide,
          map: starsTexture,
        });
        const universe = new THREE.Mesh(geometry, material);
        scene.add(universe);
      }

      const earthTexture = new THREE.TextureLoader(loadingManager).load(
          'textures/2k_earth_daymap.jpg',
      );
      earth = createSphere(0.5, 4, 0, earthTexture); // Updated distance
      scene.add(earth);
      earth.rotation.z = earthAxialTilt;

      const sunTexture = new THREE.TextureLoader(loadingManager).load(
          'textures/2k_sun.jpg',
      );
      sun = createSphere(1, 0, 0, sunTexture);
      scene.add(sun);
      sun.rotation.z = sunAxialTilt;

      // Adjust the camera position to tilt it up
      camera.position.set(7, 3.5, 0); // Adjusted vertical position
      camera.lookAt(new THREE.Vector3(0, 0, 0)); // Camera looks at the center

      sunLight = new THREE.PointLight(0xffffff, 4);
      scene.add(sunLight);

      const ambientLight = new THREE.AmbientLight();
      scene.add(ambientLight);

      window.addEventListener('resize', onWindowResize);

      // Add raycaster and mouse
      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();

      // Create an invisible plane at the Earth's orbit for dragging
      orbitPlane = new THREE.Mesh(
          new THREE.PlaneBufferGeometry(50, 50),
          new THREE.MeshBasicMaterial({ visible: false })
      );
      orbitPlane.rotateX(-Math.PI / 2); // Make it horizontal
      scene.add(orbitPlane);

      // Event listeners for dragging
      document.addEventListener('mousedown', onMouseDown);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }

    function createSphere(radius, x, y, texture) {
      const geometry = new THREE.SphereGeometry(radius, 100, 100);
      const material = new THREE.MeshPhongMaterial({
        map: texture,
        emissive: 0xffffdd,
        emissiveIntensity: 0,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = x;
      mesh.position.y = y;
      return mesh;
    }

    function rotateEarth(earthRotationPerFrame) {
      earth.rotateOnAxis(earthRotationalAxis, earthRotationPerFrame);
    }

    function rotateSun(sunRotationPerFrame) {
      sun.rotateOnAxis(sunRotationalAxis, sunRotationPerFrame);
    }

    function drawScene() {
      if (!loaded) return;

      const earthRotationPerFrame = 0.01; // Arbitrary rotation speed
      const sunRotationPerFrame = 0.001; // Arbitrary rotation speed

      rotateEarth(earthRotationPerFrame);
      rotateSun(sunRotationPerFrame);

      renderer.render(scene, camera);
    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onMouseDown(event) {
      event.preventDefault();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(earth);
      if (intersects.length > 0) {
        isDragging = true;
        initialAngle = Math.atan2(earth.position.z, earth.position.x);
      }
    }

    function onMouseMove(event) {
      if (!isDragging) return;
      event.preventDefault();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(orbitPlane);
      if (intersects.length > 0) {
        const intersectPoint = intersects[0].point;
        const angle = Math.atan2(intersectPoint.z, intersectPoint.x);
        const distance = Math.sqrt(earth.position.x ** 2 + earth.position.z ** 2);
        earth.position.set(distance * Math.cos(angle), 0, distance * Math.sin(angle));
      }
    }

    function onMouseUp(event) {
      isDragging = false;
    }

    return { drawScene, init };
  })();

  const simulation = (function() {
    function animate() {
      graphics.drawScene();
      requestAnimationFrame(animate);
    }

    function start() {
      graphics.init();
      animate();
    }

    return { start };
  })();

  simulation.start();
})();
