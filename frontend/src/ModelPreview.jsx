import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls, OBJLoader } from "three-stdlib";

export default function ModelPreview() {
	const containerRef = useRef();

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
		scene.background = new THREE.Color(0x202020);

		// Test cube
		const cube = new THREE.Mesh(
			new THREE.BoxGeometry(),
			new THREE.MeshStandardMaterial({ color: 0x007bff })
		);
		scene.add(cube);

		camera.position.z = 3;

		// Ensure render canvas resizes properly with its parent container
		const resize = () => {
			const { clientWidth, clientHeight } = container;
			renderer.setSize(clientWidth, clientHeight, false);
			camera.aspect = clientWidth / clientHeight;
			camera.updateProjectionMatrix();
		};

		const resizeObserver = new ResizeObserver(resize);
		resizeObserver.observe(container);
		resize();

		// Animation loop
		let frameId;
		const animate = () => {
			frameId = requestAnimationFrame(animate);
			controls.update();
			renderer.render(scene, camera);
		};
		animate();

		return () => {
			cancelAnimationFrame(frameId);
			resizeObserver.disconnect();
			renderer.dispose();
			container.removeChild(renderer.domElement);
		};
	}, []);

	return (
		<div ref={containerRef} className="w-full h-full relative overflow-hidden" />
	);
}
