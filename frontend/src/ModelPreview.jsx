import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls, OBJLoader } from "three-stdlib";
import "./ModelPreview.css";

export default function ModelPreview() {
	const containerRef = useRef();
	const sceneRef = useRef();       // persistent scene
	const cameraRef = useRef();
	const rendererRef = useRef();
	const modelRef = useRef();       // current preview model
	const wireframeRef = useRef();
	const drawWireframe = false;
	const controlsRef = useRef();

	const [previewModel, setPreviewModel] = useState(null);

	// Function to get current camera state
	const getPreviewCameraState = () => {
		const camera = cameraRef.current;
		const controls = controlsRef.current;

		if (!camera || !controls) return null;

		return {
			position: camera.position.clone(),
			target: controls.target.clone(),
		};
	};

	// Expose camera state to backend
	useEffect(() => {
		window.getPreviewCameraState = getPreviewCameraState;
	}, []);


	const setCameraState = (cameraState) => {
		const camera = cameraRef.current;
		const controls = controlsRef.current;
		console.log("Setting camera state", cameraState);
		if (!camera || !controls || !cameraState) return;

		camera.position.copy(cameraState.position);
		controls.target.copy(cameraState.target);
		controls.update();
	};
	// Subscribe to backend updates
	useEffect(() => {
		window.electronAPI.onPreviewUpdate(setPreviewModel);
		window.electronAPI.onCameraStateUpdate(setCameraState);
	}, []);

	// Fetch the initial preview model
	useEffect(() => {
		window.electronAPI.requestPreviewModel();
	}, []);

	// Initialize scene once
	useEffect(() => {
		const container = containerRef.current;
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
		const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

		// Make sure the canvas fills and can capture mouse events when resized
		renderer.domElement.style.width = "100%";
		renderer.domElement.style.height = "100%";
		renderer.domElement.style.display = "block";
		renderer.domElement.style.pointerEvents = "auto";
		renderer.setSize(container.clientWidth, container.clientHeight, false);
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.autoClear = true;

		container.appendChild(renderer.domElement);

		// Default camera location

		const controls = new OrbitControls(camera, renderer.domElement);
		controls.enableDamping = true;   // smoother rotation
		controls.dampingFactor = 0.05;
		controls.enableZoom = true;
		controls.enablePan = true;
		controls.target.set(10, 0, 0);
		camera.position.set(-10, 10, 0);
		controls.update();

		const light = new THREE.DirectionalLight(0xffffff, 1);
		light.position.set(1, 3, 5);
		scene.add(light);
		scene.add(new THREE.AmbientLight(0x404040));
		scene.background = new THREE.Color(0xffffff);

		camera.position.z = 3;

		// Handle resizing
		function resize() {
			const { clientWidth, clientHeight } = container;
			if (clientWidth === 0 || clientHeight === 0) return;
			camera.aspect = clientWidth / clientHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(clientWidth, clientHeight, false);
			// console.log(`Renderer resized: ${clientWidth}x${clientHeight}`);
		};

		let lastWidth = 0;
		let lastHeight = 0;
		let resizeTimeout;  // Stops the resize funtction for timeoutTime ms to prevent flickering on continuous resize.
		let timeoutTime = 50; // ms

		const resizeObserver = new ResizeObserver(() => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(() => {
				renderer.setSize(container.clientWidth, container.clientHeight, false);
				renderer.setPixelRatio(window.devicePixelRatio);
			}, timeoutTime);
		});

		resizeObserver.observe(container);

		// Since the model preview sits in a flexbox, you need to observe the parent element for size changes.
		if (container.parentElement) {
			resizeObserver.observe(container.parentElement);
		}
		resize();
		window.addEventListener("resize", resize);

		// Save refs
		sceneRef.current = scene;
		cameraRef.current = camera;
		rendererRef.current = renderer;
		controlsRef.current = controls;

		// Animation loop
		function animate() {
			requestAnimationFrame(animate);

			// Make sure that on resize of window, the model also aspect ratio scales correctly
			const width = container.clientWidth;
			const height = container.clientHeight;
			if (width !== lastWidth || height !== lastHeight) {
				camera.aspect = width / height;
				camera.updateProjectionMatrix();
				lastWidth = width;
				lastHeight = height;
			}

			controls.update();
			renderer.render(scene, camera);
		};
		animate();

		return () => {
			clearTimeout(resizeTimeout);
			resizeObserver.disconnect();
			window.removeEventListener("resize", resize);
			renderer.dispose();
			container.removeChild(renderer.domElement);
		};
	}, []);

	const handleMeshBuffers = (meshes) => {
		const scene = sceneRef.current;
		if (!scene) return;

		// Remove previous model
		if (modelRef.current) {
			for (const m of modelRef.current) {
				scene.remove(m);
				m.traverse(obj => {
					if (obj.geometry) obj.geometry.dispose();
					if (obj.material) {
						if (Array.isArray(obj.material)) obj.material.forEach(mat => mat.dispose());
						else obj.material.dispose();
					}
				});
			}
			modelRef.current = [];
		}

		modelRef.current = [];

		meshes.forEach(mesh => {
			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute('position', new THREE.BufferAttribute(mesh.vertices, 3));
			geometry.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
			geometry.computeVertexNormals();

			const material = new THREE.MeshStandardMaterial({ color: 0x0077ff, side: THREE.DoubleSide });
			const meshObj = new THREE.Mesh(geometry, material);
			scene.add(meshObj);
			modelRef.current.push(meshObj);

			if (drawWireframe) {
				const wireframe = new THREE.WireframeGeometry(geometry);
				const line = new THREE.LineSegments(wireframe);
				line.material.depthTest = false;
				line.material.opacity = 0.5;
				line.material.transparent = true;
				scene.add(line);
				wireframeRef.current = line;
			}
		});
	};

	useEffect(() => {
		window.electronAPI.onPreviewUpdate(handleMeshBuffers);
	}, []);


	return (
		<div ref={containerRef} className="model-preview-container" />
	);
}
