// Mesh class definition
class Mesh {
	constructor(vertices = [], tris = []) {
		this.vertices = vertices;
		this.tris = tris;
	}

	add(otherMesh) {
		this.vertices = this.vertices.concat(otherMesh.vertices);
		const vertexOffset = this.vertices.length;
		this.tris = this.tris.concat(otherMesh.tris.map(t => ({
			v1: t.v1 + vertexOffset,
			v2: t.v2 + vertexOffset,
			v3: t.v3 + vertexOffset,
		})));
	}

	static cube(size = 1) {
		const half = size / 2;
		const vertices = [
			{ x: -half, y: -half, z: -half },
			{ x: half, y: -half, z: -half },
			{ x: half, y: half, z: -half },
			{ x: -half, y: half, z: -half },
			{ x: -half, y: -half, z: half },
			{ x: half, y: -half, z: half },
			{ x: half, y: half, z: half },
			{ x: -half, y: half, z: half },
		];
		const tris = [
			{ v1: 0, v2: 1, v3: 2 }, { v1: 0, v2: 2, v3: 3 }, // back
			{ v1: 4, v2: 5, v3: 6 }, { v1: 4, v2: 6, v3: 7 }, // front
			{ v1: 0, v2: 1, v3: 5 }, { v1: 0, v2: 5, v3: 4 }, // bottom
			{ v1: 2, v2: 3, v3: 7 }, { v1: 2, v2: 7, v3: 6 }, // top
			{ v1: 1, v2: 2, v3: 6 }, { v1: 1, v2: 6, v3: 5 }, // right
			{ v1: 0, v2: 3, v3: 7 }, { v1: 0, v2: 7, v3: 4 }, // left
		];
		return new Mesh(vertices, tris);
	}
}

class Modifier {

	constructor() {
		this.id = Modifier.prototype.nextId++;
	}

	modify(mesh, midiNote) {
		throw new Error('modify() must be implemented by subclass');
	}

	getParameter(name, midiData) {
		if (this.parameters && name in this.parameters) {
			// Found the parameter
			// Now it could be just a value or a reference to MIDI data
			const param = this.parameters[name];
			if (typeof param === 'string' && midiData && param in midiData) {
				// It's a reference to MIDI data: look it up
				return midiData[param] * this.parameterFactors[name];
			}
			else {
				// Just a static value, return the factor
				return this.parameterFactors[name] ?? 1;
			}
		}
		throw new Error(`Parameter ${name} not found`);
	}

	setParameter(name, value) {
		if (this.parameters && name in this.parameters) {
			this.parameters[name] = value;
		}
	}

	getParameters() {
		return this.parameters;
	}

	setParameterFactor(name, factor) {
		if (this.parameters && name in this.parameters) {
			this.parameterFactors[name] = factor;
		}
	}
}

Modifier.prototype.nextId = 1;

class Translate extends Modifier {

	constructor() {
		super();

		// Default parameter values
		this.parameters = { x: "static", y: "static", z: "static" };
		this.parameterFactors = { x: 1, y: 1, z: 1 };
		this.name = "Translate";
	}

	modify(mesh, midiNote) {
		mesh.vertices = mesh.vertices.map(v => {
			return {
				x: v.x + this.getParameter('x', midiNote),
				y: v.y + this.getParameter('y', midiNote),
				z: v.z + this.getParameter('z', midiNote),
			};
		});
		return mesh;
	}
}

class Scale extends Modifier {
	constructor() {
		super();
		this.parameters = { x: 1, y: 1, z: 1 };
		this.parameterFactors = { x: 1, y: 1, z: 1 };
	}

	modify(mesh, midiNote) {
		mesh.vertices = mesh.vertices.map(v => {
			return {
				x: v.x * this.getParameter('x', midiNote) * this.parameterFactors.x,
				y: v.y * this.getParameter('y', midiNote) * this.parameterFactors.y,
				z: v.z * this.getParameter('z', midiNote) * this.parameterFactors.z,
			};
		});
		return mesh;
	}
}

class Rotate extends Modifier {
	constructor() {
		super();
		this.parameters = { angle: 0, axis_x: 1, axis_y: 0, axis_z: 0};
		this.parameterFactors = { angle: 1, axis_x: 1, axis_y: 1, axis_z: 1 };
	}

	modify(mesh, midiNote) {
		const angleRad = (this.getParameter('angle', midiNote) * this.parameterFactors.angle) * (Math.PI / 180);
		const axisX = this.getParameter('axis_x', midiNote) * this.parameterFactors.axis_x;
		const axisY = this.getParameter('axis_y', midiNote) * this.parameterFactors.axis_y;
		const axisZ = this.getParameter('axis_z', midiNote) * this.parameterFactors.axis_z;

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


module.exports = { Mesh, Modifier, Translate, Scale, Rotate };