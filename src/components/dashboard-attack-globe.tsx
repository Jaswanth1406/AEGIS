"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { AttackOrigin } from "@/lib/mock-data";

type PulseMesh = {
  mesh: THREE.Mesh;
  t: number;
  speed: number;
  maxSize: number;
};

type AttackGlobeProps = {
  attackOrigins: AttackOrigin[];
  protectedTargets: AttackOrigin[];
};

const EARTH_SPECULAR_URL = "https://threejs.org/examples/textures/planets/earth_specular_2048.jpg";

function latLonToVector3(longitude: number, latitude: number, radius: number) {
  const phi = (90 - latitude) * (Math.PI / 180);
  const theta = (longitude + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildDottedMapTexture(image: HTMLImageElement | HTMLCanvasElement | ImageBitmap) {
  const width = image.width;
  const height = image.height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;

  context.drawImage(image, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Clear canvas to a deep dark space background
  context.fillStyle = "#010308";
  context.fillRect(0, 0, width, height);

  // Set dot color mapping styles
  context.fillStyle = "#4895ff";

  const step = 3;
  const dotSize = 0.9; // radius

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      // In specular map, land is dark/black (< 128)
      const isLand = data[i] < 128;
      
      if (isLand) {
        context.globalAlpha = 0.6 + Math.random() * 0.4;
        context.beginPath();
        context.arc(x, y, dotSize, 0, 2 * Math.PI);
        context.fill();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;

  return texture;
}

export default function AttackGlobe({ attackOrigins, protectedTargets }: AttackGlobeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 3.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(5, 3, 5);
    scene.add(keyLight);

    const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
    backLight.position.set(-5, -3, -5);
    scene.add(backLight);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroup.position.set(-0.015, 0.08, 0);
    globeGroup.rotation.y = -0.55;
    globeGroup.rotation.x = 0.12;

    const globeRadius = 1.05;

    // A single, perfect sphere acting as our solid graphic globe
    const earthGeometry = new THREE.SphereGeometry(globeRadius, 128, 128);
    // Since we've pre-baked the aesthetics entirely into the procedural dots on the canvas,
    // we just need it to emit flatly.
    const earthMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
    globeGroup.add(earthMesh);

    // Network wireframe overlay for that cyber look
    const wireframeGeometry = new THREE.IcosahedronGeometry(globeRadius + 0.005, 18);
    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x4895ff,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    });
    const wireframeMesh = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
    globeGroup.add(wireframeMesh);

    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");
    textureLoader.load(
      EARTH_SPECULAR_URL,
      (loadedTexture) => {
        const sourceImage = loadedTexture.image as HTMLImageElement | HTMLCanvasElement | ImageBitmap;
        const colorTexture = buildDottedMapTexture(sourceImage);
        
        if (colorTexture) {
          loadedTexture.dispose();
          earthMaterial.map = colorTexture;
          earthMaterial.needsUpdate = true;
        }
      },
      undefined,
      () => {
        // Fallback still renders the base sphere
      }
    );

    const markerGroup = new THREE.Group();
    const routeGroup = new THREE.Group();
    globeGroup.add(routeGroup);
    globeGroup.add(markerGroup);

    const pulses: PulseMesh[] = [];
    const markerColors = [0xf43f5e, 0x10b981, 0x3b82f6, 0xd946ef, 0xa855f7];

    const createMarker = (
      loc: AttackOrigin,
      options: {
        color: number;
        size: number;
        isTarget?: boolean;
      }
    ) => {
      const [lon, lat] = loc.coordinates;
      const markerPosition = latLonToVector3(lon, lat, globeRadius + 0.005);
      
      const normal = markerPosition.clone().normalize();

      // Rings
      const numRings = options.isTarget ? 3 : 2;
      for (let i = 0; i < numRings; i++) {
        const ringGeometry = new THREE.RingGeometry(0.01, 0.015, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
          color: options.color,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide
        });
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        
        // Rings rest on surface, xz plane rotated to surface normal
        const rotQuaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
        ringMesh.position.copy(markerPosition);
        ringMesh.quaternion.copy(rotQuaternion);
        markerGroup.add(ringMesh);

        pulses.push({
          mesh: ringMesh,
          t: i * (1 / numRings), // stagger start times
          speed: 0.01 + Math.random() * 0.005,
          maxSize: options.isTarget ? 6 : 4
        });
      }
      
      return options.color;
    };

    const originColorMap = new Map<AttackOrigin, number>();

    attackOrigins.forEach((origin) => {
      const randomColor = markerColors[Math.floor(Math.random() * markerColors.length)];
      originColorMap.set(origin, randomColor);
      createMarker(origin, { color: randomColor, size: 0.028 });
    });

    protectedTargets.forEach((target) => {
      const randomColor = markerColors[Math.floor(Math.random() * markerColors.length)];
      originColorMap.set(target, randomColor);
      createMarker(target, { color: 0x3570e8, size: 0.024, isTarget: true });
    });

    attackOrigins.forEach((origin) => {
      protectedTargets.forEach((target) => {
        const [originLon, originLat] = origin.coordinates;
        const [targetLon, targetLat] = target.coordinates;

        const start = latLonToVector3(originLon, originLat, globeRadius + 0.01);
        const end = latLonToVector3(targetLon, targetLat, globeRadius + 0.01);

        const midpoint = start.clone().add(end).multiplyScalar(0.5);
        const arcHeight = 0.2 + start.distanceTo(end) * 0.15;
        const control = midpoint.normalize().multiplyScalar(globeRadius + arcHeight);

        const curve = new THREE.QuadraticBezierCurve3(start, control, end);
        const points = curve.getPoints(70);
        const routeGeometry = new THREE.BufferGeometry().setFromPoints(points);
        
        const pathColor = originColorMap.get(origin) || 0xe53e5c;
        const routeMaterial = new THREE.LineBasicMaterial({
          color: pathColor,
          transparent: true,
          opacity: 0.42,
        });
        const routeLine = new THREE.Line(routeGeometry, routeMaterial);
        routeGroup.add(routeLine);
      });
    });

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) {
        return;
      }
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      // Render at the strict width and height, but let CSS handle the display size
      renderer.setSize(width, height, false);
    };

    resize();

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);

    let isDragging = false;
    let previousX = 0;
    let previousY = 0;

    renderer.domElement.style.cursor = "grab";

    const onPointerDown = (event: PointerEvent) => {
      isDragging = true;
      previousX = event.clientX;
      previousY = event.clientY;
      renderer.domElement.style.cursor = "grabbing";
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!isDragging) {
        return;
      }

      const deltaX = event.clientX - previousX;
      const deltaY = event.clientY - previousY;

      globeGroup.rotation.y += deltaX * 0.005;
      globeGroup.rotation.x = clamp(globeGroup.rotation.x + deltaY * 0.003, -0.6, 0.6);

      previousX = event.clientX;
      previousY = event.clientY;
    };

    const onPointerUp = () => {
      isDragging = false;
      renderer.domElement.style.cursor = "grab";
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    let animationFrame = 0;

    const animate = () => {
      animationFrame = window.requestAnimationFrame(animate);

      if (!isDragging) {
        globeGroup.rotation.y += 0.0012;
      }

      pulses.forEach((pulse) => {
        pulse.t += pulse.speed;
        if (pulse.t > 1) {
          pulse.t = 0;
        }

        const scale = 1 + (pulse.maxSize - 1) * pulse.t;
        pulse.mesh.scale.setScalar(scale);

        const pulseMaterial = pulse.mesh.material as THREE.MeshBasicMaterial;
        // Fade out as it expands
        pulseMaterial.opacity = (1 - pulse.t) * 0.8;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();

      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((material) => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });

      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [attackOrigins, protectedTargets]);

  return <div ref={containerRef} className="w-full h-full" aria-label="Interactive global attack globe" />;
}