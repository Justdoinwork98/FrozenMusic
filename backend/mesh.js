const OBJFile = require('obj-file-parser');
const fs = require('fs');

class Mesh {
	constructor(vertices = [], tris = []) {
		this.vertices = vertices;
		this.tris = tris;
	}

	static meshCache = new Map(); // path -> Mesh

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
		const newVertices = this.vertices.map(v => ({ x: v.x, y: v.y, z: v.z }));
		const newTris = this.tris.map(t => ({ v1: t.v1, v2: t.v2, v3: t.v3 }));
		return new Mesh(newVertices, newTris);
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

	static combine(mesh1, mesh2) {
		const combinedMesh = mesh1.clone();
		combinedMesh.add(mesh2);
		return combinedMesh;
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

	static plane(width = 1, depth = 1, subdivisions = 2) {
		const halfWidth = width / 2;
		const halfDepth = depth / 2;

		const vertices = [
			{ x: -halfWidth, y: 0, z: -halfDepth },
			{ x: halfWidth, y: 0, z: -halfDepth },
			{ x: halfWidth, y: 0, z: halfDepth },
			{ x: -halfWidth, y: 0, z: halfDepth },
		];
		const tris = [
			{ v1: 0, v2: 1, v3: 2 },
			{ v1: 0, v2: 2, v3: 3 },
		];
		let plane = new Mesh(vertices, tris);
		plane.subdivide(subdivisions); // Subdivide for more detail
		return plane;
	}

	static cylinder(diameter = 1, height = 1, subdivisions=2) {
		const radius = diameter / 2;
		// num segments = 6 * 2^subdivisions (6 default, doubles each subdivision)
		const segments = Math.max(3, Math.floor(6 * Math.pow(2, subdivisions))); // Increase segments with subdivisions
		const vertices = [];
		const tris = [];

		// Create top and bottom center vertices
		vertices.push({ x: 0, y: height / 2, z: 0 }); // Top center
		vertices.push({ x: 0, y: -height / 2, z: 0 }); // Bottom center
		const topCenterIndex = 0;
		const bottomCenterIndex = 1;

		// Create circle vertices
		for (let i = 0; i < segments; i++) {
			const angle = (i / segments) * Math.PI * 2;
			const x = Math.cos(angle) * radius;
			const z = Math.sin(angle) * radius;
			vertices.push({ x: x, y: height / 2, z: z }); // Top edge
			vertices.push({ x: x, y: -height / 2, z: z }); // Bottom edge
		}

		// Create top and bottom faces
		for (let i = 0; i < segments; i++) {
			// Top face
			const topEdgeIndex = 2 + i * 2;
			const nextTopEdgeIndex = 2 + ((i + 1) % segments) * 2;
			tris.push({ v1: topCenterIndex, v2: nextTopEdgeIndex, v3: topEdgeIndex });

			// Bottom face
			const bottomEdgeIndex = 2 + i * 2 + 1;
			const nextBottomEdgeIndex = 2 + ((i + 1) % segments) * 2 + 1;
			tris.push({ v1: bottomCenterIndex, v2: bottomEdgeIndex, v3: nextBottomEdgeIndex });
		}

		// Create side faces
		for (let i = 0; i < segments; i++) {
			const topEdgeIndex = 2 + i * 2;
			const bottomEdgeIndex = 2 + i * 2 + 1;
			const nextTopEdgeIndex = 2 + ((i + 1) % segments) * 2;
			const nextBottomEdgeIndex = 2 + ((i + 1) % segments) * 2 + 1;
			tris.push({ v1: topEdgeIndex, v2: nextTopEdgeIndex, v3: bottomEdgeIndex });
			tris.push({ v1: bottomEdgeIndex, v2: nextTopEdgeIndex, v3: nextBottomEdgeIndex });
		}

		return new Mesh(vertices, tris);
	}

	static loadFromPath(path) {

		if (Mesh.meshCache.has(path)) {
			const mesh = Mesh.meshCache.get(path).clone();
			return mesh;
		}

		// Load mesh from file path
		const mesh = new Mesh();

		// Get file contents
		let fileContents = fs.readFileSync(path, 'utf-8');

		const objFile = new OBJFile(fileContents);
		const parsed = objFile.parse();

		// Load vertices
		for (const v of parsed.models[0].vertices) {
			mesh.vertices.push({ x: v.x, y: v.y, z: v.z });
		}

		// Load faces (triangles only)
		for (const face of parsed.models[0].faces) {
			if (face.vertices.length === 3) {
				mesh.tris.push({
					v1: face.vertices[0].vertexIndex - 1,
					v2: face.vertices[1].vertexIndex - 1,
					v3: face.vertices[2].vertexIndex - 1,
				});
			}
			if (face.vertices.length === 4) {
				// Split quad into two triangles
				mesh.tris.push({
					v1: face.vertices[0].vertexIndex - 1,
					v2: face.vertices[1].vertexIndex - 1,
					v3: face.vertices[2].vertexIndex - 1,
				});
				mesh.tris.push({
					v1: face.vertices[0].vertexIndex - 1,
					v2: face.vertices[2].vertexIndex - 1,
					v3: face.vertices[3].vertexIndex - 1,
				});
			}
		}

		Mesh.meshCache.set(path, mesh);
		return mesh.clone();
	}
}

module.exports = { Mesh };