import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls, OBJLoader } from "three-stdlib";

export default function ModelPreview() {
	const containerRef = useRef();
	const sceneRef = useRef();       // persistent scene
	const cameraRef = useRef();
	const rendererRef = useRef();
	const modelRef = useRef();       // current preview model
	const controlsRef = useRef();

	const [previewModel, setPreviewModel] = useState(null);

	// Subscribe to backend updates
	useEffect(() => {
		window.electronAPI.onPreviewUpdate(setPreviewModel);
	}, []);

	// Fetch the initial preview model
	useEffect(() => {
		window.electronAPI.getPreviewModel().then(setPreviewModel);
	}, []);

	// Initialize scene once
	useEffect(() => {
		const container = containerRef.current;
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
		const renderer = new THREE.WebGLRenderer({ antialias: true });

		// Make sure the canvas fills and can capture mouse events when resized
		renderer.domElement.style.width = "100%";
		renderer.domElement.style.height = "100%";
		renderer.domElement.style.display = "block";
		renderer.domElement.style.pointerEvents = "auto";
		renderer.setPixelRatio(window.devicePixelRatio);

		container.appendChild(renderer.domElement);

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;   // smoother rotation
		controls.dampingFactor = 0.05;
		controls.enableZoom = true;
		controls.enablePan = true;

		const light = new THREE.DirectionalLight(0xffffff, 1);
		light.position.set(1, 3, 5);
		scene.add(light);
		scene.add(new THREE.AmbientLight(0x404040));

		camera.position.z = 3;

		// Handle resizing
		function resize() {
			const { clientWidth, clientHeight } = container;
			camera.aspect = clientWidth / clientHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(clientWidth, clientHeight);
		};

		const resizeObserver = new ResizeObserver(resize);
		resizeObserver.observe(container);
		resize();

		// Save refs
		sceneRef.current = scene;
		cameraRef.current = camera;
		rendererRef.current = renderer;
		controlsRef.current = controls;

		// Animation loop
		function animate() {
			requestAnimationFrame(animate);
			controls.update();
			renderer.render(scene, camera);
		};
		animate();

		return () => {
			resizeObserver.disconnect();
			window.removeEventListener("resize", resize);
			renderer.dispose();
			container.removeChild(renderer.domElement);
		};
	}, []);

	// Update the preview model whenever previewModel changes
	useEffect(() => {
		const scene = sceneRef.current;
		if (!scene) return;

		// Remove old model if present
		console.log("Current modelRef:", modelRef.current);
		if (modelRef.current) {
			scene.remove(modelRef.current);
			modelRef.current.traverse(obj => {
				if (obj.geometry) obj.geometry.dispose();
				if (obj.material) {
					if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
					else obj.material.dispose();
				}
			});
			modelRef.current = null;
		}

		if (!previewModel) return;

		console.log("Updating preview model:", previewModel);

		// previewModels is an array of { vertices: [], tris: [] }
		for (const previewMesh of previewModel) {
			const geometry = new THREE.BufferGeometry();
			const vertices = new Float32Array(previewMesh.vertices.length * 3);
			previewMesh.vertices.forEach((v, i) => {
				vertices[i * 3] = v.x;
				vertices[i * 3 + 1] = v.y;
				vertices[i * 3 + 2] = v.z;
			});
			geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
			const indices = new Uint32Array(previewMesh.tris.length * 3);
			previewMesh.tris.forEach((t, i) => {
				indices[i * 3] = t.v1;
				indices[i * 3 + 1] = t.v2;
				indices[i * 3 + 2] = t.v3;
			});
			geometry.setIndex(new THREE.BufferAttribute(indices, 1));
			geometry.computeVertexNormals();
			const material = new THREE.MeshStandardMaterial({ color: 0x0077ff, side: THREE.DoubleSide });
			const mesh = new THREE.Mesh(geometry, material);
			scene.add(mesh);
			modelRef.current = mesh;
		}


	}, [previewModel]);

	return (
		<div ref={containerRef} className="w-full h-full relative overflow-hidden" />
	);
}
