import { renderer, scene ,camera } from "../App";
import * as THREE from 'three'

function saturn() {
    scene.background = new THREE.Color(0x000000); // Pure black space

    // Lighting: Ambient and Directional Light (Sunlight)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Dim ambient light for space
    scene.add(ambientLight);  

    // Sunlight: directional light casting shadows on one side of Saturn
    const sunlight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunlight.position.set(10, 5, 5); // Set the light source at an angle to Saturn
    sunlight.castShadow = true; // Enable shadows
    sunlight.shadow.mapSize.width = 2048;
    sunlight.shadow.mapSize.height = 2048;
    sunlight.shadow.camera.near = 0.5;
    sunlight.shadow.camera.far = 50;
    scene.add(sunlight);

    // Saturn creation with emissive material (slight glow effect)
    const saturnTexture = new THREE.TextureLoader().load('./src/img/earth1.jpg'); // Load your texture here
    const geometry = new THREE.SphereGeometry(1, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      map: saturnTexture,
      emissive: new THREE.Color(0x222222),  // Slight glow effect
      emissiveIntensity: 0.4,
    });
    const saturn = new THREE.Mesh(geometry, material);
    
    // Enable shadow casting and receiving for Saturn
    saturn.castShadow = true;
    saturn.receiveShadow = true;

    // Position Saturn upright without tilt
    saturn.rotation.z = 0;
    scene.add(saturn);

    // Create a horizontal ring around Saturn with particles (celestial bodies)
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.03,
      transparent: true,
      opacity: 0.6,  // Slightly transparent
      depthWrite: false,  // Prevents z-fighting issues
      blending: THREE.AdditiveBlending,  // Smooth alpha transitions
    });

    // Generate particles for the ring with variable size
    const particlesCount = 9000;
    const ringParticles = new Float32Array(particlesCount * 3);
    const particleSizes = new Float32Array(particlesCount);

    const innerRadius = 2;
    const outerRadius = 3.5;

    for (let i = 0; i < particlesCount; i++) {
      const angle = Math.random() * 2 * Math.PI;
      const radius = THREE.MathUtils.lerp(innerRadius, outerRadius, Math.random());
      const x = radius * Math.cos(angle);
      const y = (Math.random() - 0.5) * 0.02; // Very thin vertical displacement
      const z = radius * Math.sin(angle);

      ringParticles[i * 3] = x;
      ringParticles[i * 3 + 1] = y;
      ringParticles[i * 3 + 2] = z;

      // Gradually increase the particle size towards the outer radius
      particleSizes[i] = THREE.MathUtils.lerp(0.02, 0.08, (radius - innerRadius) / (outerRadius - innerRadius));
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(ringParticles, 3));
    particlesGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

    const ring = new THREE.Points(particlesGeometry, particlesMaterial);

    // Keep the ring horizontal without tilt
    ring.rotation.z = 0;
    
    // Enable shadow receiving for the ring
    ring.receiveShadow = true;
    // scene.add(ring);

    // Add celestial bodies of varying sizes
    const celestialBodiesGeometry = new THREE.SphereGeometry(0.01, 16, 16);
    const celestialBodiesMaterial = new THREE.MeshStandardMaterial({ color: 0xffddaa });

    for (let i = 0; i < 100; i++) { // Increase count for more celestial bodies
      const celestialBody = new THREE.Mesh(celestialBodiesGeometry, celestialBodiesMaterial);
      celestialBody.position.set(
        THREE.MathUtils.randFloatSpread(50), // Increase the spread to cover more space
        THREE.MathUtils.randFloatSpread(50),
        THREE.MathUtils.randFloatSpread(50)
      );
      celestialBody.castShadow = true;
      celestialBody.receiveShadow = true;
      scene.add(celestialBody);
    }

    // Star field with more stars
    const starsGeometry = new THREE.BufferGeometry();
    const starVertices = [];
    for (let i = 0; i < 20000; i++) { // Increased star count
      const x = THREE.MathUtils.randFloatSpread(2000);
      const y = THREE.MathUtils.randFloatSpread(2000);
      const z = THREE.MathUtils.randFloatSpread(2000);
      starVertices.push(x, y, z);
    }
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));

    const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.05 });
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);

   
    // OrbitControls for mouse control
    
    // Animation function
    const animate = function () {
      requestAnimationFrame(animate);

      // Saturn rotation (around its axis - Y-axis)
      saturn.rotation.y += 0.002;  // Slight increase for continuous rotation

      // Update controls

      // Render the scen
    };

    animate();
}

export default saturn ;