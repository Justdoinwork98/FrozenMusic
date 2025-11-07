const { Mesh } = require('../mesh.js');
const { Node, InputPoint, OutputPoint } = require('./node.js');

class Modifier extends Node {

	constructor(inputs, outputs) {
		super("Modifier", inputs, outputs);
	}

	static fromJSON(data) {
	}
}

class TranslateModifier extends Modifier {

	constructor() {
		const inputs = [
			new InputPoint("Mesh Input", "Mesh", null),
			new InputPoint("x", "Number", 1),
			new InputPoint("y", "Number", 0),
			new InputPoint("z", "Number", 0),
		];
		const outputs = [
			new OutputPoint("Mesh Output", "Mesh"),
		];
		super(inputs, outputs);

		this.name = "Translate";
	}
	
	// Get the inputs and return the output Mesh
	getOutput(network, midiData, outputIndex) {
		// TODO do we need to make a clone here?
		let mesh = this.inputs[0].connection;
		if (!mesh) {
			throw new Error('Mesh input is not connected');
		}

		if (outputIndex !== 0) {
			throw new Error('Invalid output index for TranslateModifier: ' + outputIndex);
		}

		const xInputValue = this.getInput(1, midiData);
		const yInputValue = this.getInput(2, midiData);
		const zInputValue = this.getInput(3, midiData);

		mesh.vertices = mesh.vertices.map(v => {
			return {
				x: v.x + xInputValue,
				y: v.y + yInputValue,
				z: v.z + zInputValue,
			};
		});

		return mesh;
	}
}

class ScaleModifier extends Modifier {
	constructor() {
		super();
		this.parameters = { x: "static", y: "static", z: "static" };
		this.parameterFactors = { x: 1, y: 1, z: 1 };
		this.parameterNames = ['x', 'y', 'z'];
		this.name = "Scale";
	}

	modify(mesh, midiNote) {
		mesh.vertices = mesh.vertices.map(v => {
			return {
				x: v.x * this.getParameter('x', midiNote),
				y: v.y * this.getParameter('y', midiNote),
				z: v.z * this.getParameter('z', midiNote),
			};
		});
		return mesh;
	}
}

class RotateModifier extends Modifier {
	constructor() {
		super();
		this.parameters = { angle: "static", axis_x: "static", axis_y: "static", axis_z: "static"};
		this.parameterFactors = { angle: 1, axis_x: 1, axis_y: 0, axis_z: 0 };
		this.parameterNames = ['angle', 'x', 'y', 'z'];
		this.name = "Rotate";
	}

	modify(mesh, midiNote) {
		const angleRad = this.getParameter('angle', midiNote) * (Math.PI / 180);
		const axisX = this.getParameter('axis_x', midiNote);
		const axisY = this.getParameter('axis_y', midiNote);
		const axisZ = this.getParameter('axis_z', midiNote);

		// Normalize rotation axis
		const length = Math.sqrt(axisX * axisX + axisY * axisY + axisZ * axisZ);
		if (length === 0) return mesh;
		const uX = axisX / length;
		const uY = axisY / length;
		const uZ = axisZ / length;

		const cosA = Math.cos(angleRad);
		const sinA = Math.sin(angleRad);
		const oneMinusCosA = 1 - cosA;

		// Build rotation matrix (Rodrigues' rotation formula)
		const rot = [
			[
				cosA + uX*uX*oneMinusCosA,
				uX*uY*oneMinusCosA - uZ*sinA,
				uX*uZ*oneMinusCosA + uY*sinA
			],
			[
				uY*uX*oneMinusCosA + uZ*sinA,
				cosA + uY*uY*oneMinusCosA,
				uY*uZ*oneMinusCosA - uX*sinA
			],
			[
				uZ*uX*oneMinusCosA - uY*sinA,
				uZ*uY*oneMinusCosA + uX*sinA,
				cosA + uZ*uZ*oneMinusCosA
			]
		];

		// Apply rotation to each vertex
		mesh.vertices = mesh.vertices.map(v => {
			const x = v.x, y = v.y, z = v.z;
			return {
				x: rot[0][0]*x + rot[0][1]*y + rot[0][2]*z,
				y: rot[1][0]*x + rot[1][1]*y + rot[1][2]*z,
				z: rot[2][0]*x + rot[2][1]*y + rot[2][2]*z
			};
		});
		return mesh;
	}
}

class ArrayModifier extends Modifier {

	constructor() {
		super();

		// Default parameter values
		this.parameters = { count: "static", distance: "static", "axis_x": "static", "axis_y": "static", "axis_z": "static" };
		this.parameterFactors = { count: 2, distance: 1, axis_x: 1, axis_y: 0, axis_z: 0 };
		this.parameterNames = ['count', 'distance', 'x', 'y', 'z'];
		this.name = "Array";
	}

	modify(mesh, midiNote) {
		const count = Math.max(1, Math.floor(this.getParameter('count', midiNote)));
		const distance = this.getParameter('distance', midiNote);
		const axisX = this.getParameter('axis_x', midiNote);
		const axisY = this.getParameter('axis_y', midiNote);
		const axisZ = this.getParameter('axis_z', midiNote);

		for (let i = 0; i < count; i++) {
			const offsetX = axisX * distance * i;
			const offsetY = axisY * distance * i;
			const offsetZ = axisZ * distance * i;

			const vertexOffset = mesh.vertices.length;

			let newVertices = mesh.vertices.map(v => {
				return {
					x: v.x + offsetX,
					y: v.y + offsetY,
					z: v.z + offsetZ
				};
			});
			mesh.vertices.push(...newVertices);

			// Add the triangles for the new vertices (identical but with offset)
			mesh.tris.push(...mesh.tris.map(t => ({
				v1: t.v1 + vertexOffset,
				v2: t.v2 + vertexOffset,
				v3: t.v3 + vertexOffset,
			})));
		}
		return mesh;
	}
}

class SmoothModifier extends Modifier {

	constructor() {
		super();

		// Default parameter values
		this.parameters = { smoothness: "static" };
		this.parameterFactors = { smoothness: 1 };
		this.parameterNames = ['smoothness'];
		this.name = "Smooth";
	}

	modify(mesh, midiNote) {
		const smoothnessIterations = Math.floor(this.getParameter('smoothness', midiNote)) + 1;
		const smoothnessFinal = this.getParameter('smoothness', midiNote) - smoothnessIterations;

		// Simple Laplacian smoothing
		const vertexNeighbors = new Array(mesh.vertices.length).fill(0).map(() => []);

		// Build neighbor list
		for (const tri of mesh.tris) {
			vertexNeighbors[tri.v1].push(tri.v2, tri.v3);
			vertexNeighbors[tri.v2].push(tri.v1, tri.v3);
			vertexNeighbors[tri.v3].push(tri.v1, tri.v2);
		}

		console.log("Before smoothed mesh size: ", mesh.vertices.length, " vertices, ", mesh.tris.length, " triangles.");

		for (let i = 0; i < smoothnessIterations; i++) {
			let smoothFactor = (i === smoothnessIterations - 1) ? smoothnessFinal : 1;

			const newVertices = mesh.vertices.map((v, idx) => {
				// Find the neighbours and verify there are any
				const neighbors = vertexNeighbors[idx];
				if (neighbors.length === 0) return v;

				// Compute the average position of neighbors
				let avgX = 0, avgY = 0, avgZ = 0;
				for (const nIdx of neighbors) {
					avgX += mesh.vertices[nIdx].x;
					avgY += mesh.vertices[nIdx].y;
					avgZ += mesh.vertices[nIdx].z;
				}
				avgX /= neighbors.length;
				avgY /= neighbors.length;
				avgZ /= neighbors.length;

				// Move vertex towards average position
				return {
					x: v.x * (1.0 - smoothFactor) + avgX * smoothFactor,
					y: v.y * (1.0 - smoothFactor) + avgY * smoothFactor,
					z: v.z * (1.0 - smoothFactor) + avgZ * smoothFactor,
				};
			});

			mesh.vertices = newVertices;
		}

		console.log("Final smoothed mesh size: ", mesh.vertices.length, " vertices, ", mesh.tris.length, " triangles.");

		return mesh;
	}
}



module.exports = { Mesh, Modifier, TranslateModifier, ScaleModifier, RotateModifier, ArrayModifier, SmoothModifier };