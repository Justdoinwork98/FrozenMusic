import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls, OBJLoader } from "three-stdlib";

export default function ModelPreview() {
	const containerRef = useRef();

	useEffect(() => {
		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
		const renderer = new THREE.WebGLRenderer({ antialias: true });
		containerRef.current.appendChild(renderer.domElement);

		const controls = new OrbitControls(camera, renderer.domElement);
		const light = new THREE.DirectionalLight(0xffffff, 1);
		light.position.set(1, 3, 5);
		light.target.position.set(0, 0, 0);
		scene.add(light);
		scene.add(new THREE.AmbientLight(0x404040));
		scene.background = new THREE.Color(0x202020);

		//const loader = new OBJLoader();
		//loader.load(modelPath, (obj) => scene.add(obj));

		// Simple geometry for demonstration
		const geometry = new THREE.BoxGeometry();
		const material = new THREE.MeshStandardMaterial({ color: 0x007bff });
		const cube = new THREE.Mesh(geometry, material);
		scene.add(cube);

		camera.position.z = 3;

		function resize() {
			const { clientWidth, clientHeight } = containerRef.current;
			camera.aspect = clientWidth / clientHeight;
			camera.updateProjectionMatrix();
			renderer.setSize(clientWidth, clientHeight);
		}
		window.addEventListener("resize", resize);
		resize();

		function animate() {
			requestAnimationFrame(animate);
			controls.update();
			renderer.render(scene, camera);
		}
		animate();

		return () => {
			renderer.dispose();
			window.removeEventListener("resize", resize);
		};
	}, []);

	return (
		<div className="model-preview">
			<div ref={containerRef} className="w-full h-full" />

		</div>
	);
}
