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

	clone() {
		return new Mesh(
			this.vertices.slice(0),
			this.tris.slice(0)
		);
	}

	subdivide(iterations=1) {
		if (iterations <= 0) return;

		// Subdivide each triangle into 4 smaller triangles
		const newVertices = [];
		const newTris = [];

		const vertexMap = new Map(); // To avoid duplicating vertices

		const getMidpoint = (v1, v2) => {
			return {
				x: (v1.x + v2.x) / 2,
				y: (v1.y + v2.y) / 2,
				z: (v1.z + v2.z) / 2,
			};
		};

		for (const tri of this.tris) {
			const v1 = this.vertices[tri.v1];
			const v2 = this.vertices[tri.v2];
			const v3 = this.vertices[tri.v3];

			const v1v2mid = getMidpoint(v1, v2);
			const v2v3mid = getMidpoint(v2, v3);
			const v3v1mid = getMidpoint(v3, v1);

			const v1v2midKey = `${v1v2mid.x},${v1v2mid.y},${v1v2mid.z}`;
			const v2v3midKey = `${v2v3mid.x},${v2v3mid.y},${v2v3mid.z}`;
			const v3v1midKey = `${v3v1mid.x},${v3v1mid.y},${v3v1mid.z}`;

			let v1v2midIndex, v2v3midIndex, v3v1midIndex;

			const getOrCreateVertex = (key, vertex) => {
				if (vertexMap.has(key)) {
					return vertexMap.get(key);
				} else {
					const index = this.vertices.length + newVertices.length;
					newVertices.push(vertex);
					vertexMap.set(key, index);
					return index;
				}
			};

			v1v2midIndex = getOrCreateVertex(v1v2midKey, v1v2mid);
			v2v3midIndex = getOrCreateVertex(v2v3midKey, v2v3mid);
			v3v1midIndex = getOrCreateVertex(v3v1midKey, v3v1mid);

			newTris.push({ v1: tri.v1, v2: v1v2midIndex, v3: v3v1midIndex });
			newTris.push({ v1: tri.v2, v2: v2v3midIndex, v3: v1v2midIndex });
			newTris.push({ v1: tri.v3, v2: v3v1midIndex, v3: v2v3midIndex });
			newTris.push({ v1: v1v2midIndex, v2: v2v3midIndex, v3: v3v1midIndex });
		}

		this.vertices = this.vertices.concat(newVertices);
		this.tris = newTris;

		this.subdivide(iterations - 1);
	}

	static cube(size = 1, subdivisions = 2) {
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
		let cube = new Mesh(vertices, tris);
		cube.subdivide(subdivisions); // Subdivide for more detail
		return cube;
	}

	static sphere(radius = 1, subdivisions = 2) {
		// Golden ratio
		const t = (1 + Math.sqrt(5)) / 2;

		// Initial 12 vertices of an icosahedron
		let vertices = [
			{ x: -1, y:  t, z: 0 },
			{ x:  1, y:  t, z: 0 },
			{ x: -1, y: -t, z: 0 },
			{ x:  1, y: -t, z: 0 },

			{ x: 0, y: -1, z:  t },
			{ x: 0, y:  1, z:  t },
			{ x: 0, y: -1, z: -t },
			{ x: 0, y:  1, z: -t },

			{ x:  t, y: 0, z: -1 },
			{ x:  t, y: 0, z:  1 },
			{ x: -t, y: 0, z: -1 },
			{ x: -t, y: 0, z:  1 },
		];

		// Normalize all initial vertices
		for (let v of vertices) {
			const len = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
			v.x /= len;
			v.y /= len;
			v.z /= len;
		}

		// 20 faces of an icosahedron (by vertex indices)
		const tris = [
			{ v1: 0, v2: 11, v3: 5 },
			{ v1: 0, v2: 5, v3: 1 },
			{ v1: 0, v2: 1, v3: 7 },
			{ v1: 0, v2: 7, v3: 10 },
			{ v1: 0, v2: 10, v3: 11 },

			{ v1: 1, v2: 5, v3: 9 },
			{ v1: 5, v2: 11, v3: 4 },
			{ v1: 11, v2: 10, v3: 2 },
			{ v1: 10, v2: 7, v3: 6 },
			{ v1: 7, v2: 1, v3: 8 },

			{ v1: 3, v2: 9, v3: 4 },
			{ v1: 3, v2: 4, v3: 2 },
			{ v1: 3, v2: 2, v3: 6 },
			{ v1: 3, v2: 6, v3: 8 },
			{ v1: 3, v2: 8, v3: 9 },

			{ v1: 4, v2: 9, v3: 5 },
			{ v1: 2, v2: 4, v3: 11 },
			{ v1: 6, v2: 2, v3: 10 },
			{ v1: 8, v2: 6, v3: 7 },
			{ v1: 9, v2: 8, v3: 1 },
		];

		const mesh = new Mesh(vertices, tris);

		// Subdivide to increase resolution
		mesh.subdivide(subdivisions);

		// Normalize all vertices again (they drift off the sphere)
		for (let v of mesh.vertices) {
			const len = Math.sqrt(v.x*v.x + v.y*v.y + v.z*v.z);
			v.x = (v.x / len) * radius;
			v.y = (v.y / len) * radius;
			v.z = (v.z / len) * radius;
		}

		return mesh;
	}
}

class Modifier {

	constructor() {
		// TODO this will fail when a project was loaded with existing modifiers (and ids)
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

	toJSON() {
		return {
			id: this.id,
			name: this.name,
			parameters: this.parameters,
			parameterFactors: this.parameterFactors,
		};
	}

	static fromJSON(data) {
		let modifier;
		switch (data.name) {
			case 'Translate':
				modifier = new Translate();
				break;
			case 'Scale':
				modifier = new Scale();
				break;
			case 'Rotate':
				modifier = new Rotate();
				break;
			// Add other modifiers here
			default:
				throw new Error(`Unknown modifier type: ${data.name}`);
		}
		modifier.id = data.id;
		modifier.parameters = data.parameters;
		modifier.parameterFactors = data.parameterFactors;
		return modifier;
	}
}

Modifier.prototype.nextId = 1;

class Translate extends Modifier {

	constructor() {
		super();

		// Default parameter values
		this.parameters = { x: "static", y: "static", z: "static" };
		this.parameterFactors = { x: 1, y: 1, z: 1 };
		this.parameterNames = ['x', 'y', 'z'];
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

class Rotate extends Modifier {
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


module.exports = { Mesh, Modifier, Translate, Scale, Rotate };