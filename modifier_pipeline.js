const { Mesh, Modifier, Translate, Scale, Rotate } = require('./modifier.js');

class Track {
	constructor(name) {
		this.name = name;
		this.modifiers = [];
	}

	addModifier(modifier) {
		this.modifiers.push(modifier);
	}

	runModifierPipeline(input, midiData) {

		let totalMesh = new Mesh();

		for (const modifier of this.modifiers) {
			console.log(`Modifier: ${modifier.constructor.name}, Parameters: ${JSON.stringify(modifier.parameters)}`);
		}

		for (const midiNote of midiData) {
			let mesh = input.clone();

			console.log("mesh input: ", mesh);

			for (const modifier of this.modifiers) {
				mesh = modifier.modify(mesh, midiNote);
			}

			console.log("mesh output: ", mesh);

			totalMesh.add(mesh);
		}

		return totalMesh;
	}

	toJSON() {
		return {
			modifiers: this.modifiers.map(modifier => modifier.toJSON()),
		};
	}

	static fromJSON(trackName, data) {
		const track = new Track(trackName);
		for (const modifierData of data.modifiers) {
			const modifier = Modifier.fromJSON(modifierData);
			track.addModifier(modifier);
		}
		return track;
	}
}

class ModifierPipeline {
	constructor() {
		this.tracks = new Map();
		this.availableModifiers = {
			'Translate': Translate,
			'Scale': Scale,
			'Rotate': Rotate,
		};
	}

	addNewTrack(trackName) {
		this.tracks.set(trackName, new Track(trackName));
	}

	addTrack(track) {
		this.tracks.set(track.name, track);
	}

	addModifierToTrack(trackName, modifierName) {
		const track = this.tracks.get(trackName);
		if (!track) {
			throw new Error(`Track "${trackName}" not found`);
		}

		// Instantiate the modifier if it's a class name
		if (typeof modifierName === 'string' && modifierName in this.availableModifiers) {
			let modifier = new this.availableModifiers[modifierName]();
			track.addModifier(modifier);
		}
		else {
			throw new Error(`Modifier type "${modifierName}" is not available`);
		}
	}

	setParameter(trackName, modifierId, parameterName, value) {
		const track = this.tracks.get(trackName);
		if (!track) {
			throw new Error(`Track "${trackName}" not found`);
		}
		for (const modifier of track.modifiers) {
			if (modifier.id === modifierId) {
				modifier.setParameter(parameterName, value);
				return;
			}
		}
		throw new Error(`Modifier with ID ${modifierId} not found in track "${trackName}"`);
	}

	setParameterFactor(trackName, modifierId, parameterName, factor) {
		const track = this.tracks.get(trackName);
		if (!track) {
			throw new Error(`Track "${trackName}" not found`);
		}
		for (const modifier of track.modifiers) {
			if (modifier.id === modifierId) {
				if (typeof modifier.setParameterFactor === 'function') {
					modifier.setParameterFactor(parameterName, factor);
					return;
				} else {
					throw new Error(`Modifier with ID ${modifierId} does not support parameter factors`);
				}
			}
		}
		throw new Error(`Modifier with ID ${modifierId} not found in track "${trackName}"`);
	}


	runTrack(trackName, input) {
		const track = this.tracks.get(trackName);
		if (!track) {
			throw new Error(`Track "${trackName}" not found`);
		}
		return track.run(input);
	}

	runModifierPipeline(input) {
	
		const sampleMidiData = [
			{ noteNumber: 60, velocity: 100, startTime: 0, duration: 480 },
			{ noteNumber: 62, velocity: 100, startTime: 480, duration: 480 },
			{ noteNumber: 64, velocity: 100, startTime: 960, duration: 480 },
			{ noteNumber: 65, velocity: 100, startTime: 1440, duration: 480 },
			{ noteNumber: 67, velocity: 100, startTime: 1920, duration: 480 },
			{ noteNumber: 69, velocity: 100, startTime: 2400, duration: 480 },
			{ noteNumber: 71, velocity: 100, startTime: 2880, duration: 480 },
			{ noteNumber: 72, velocity: 100, startTime: 3360, duration: 480 },
		]

		let meshes = [];
		for (const track of this.tracks.values()) {
			meshes.push(track.runModifierPipeline(input, sampleMidiData));
		}
		return meshes;
	}

	reorderModifier(trackName, previousIndex, newIndex) {
		if (!this.tracks.has(trackName)) {
			throw new Error(`Track "${trackName}" not found`);
		}

		const track = this.tracks.get(trackName);
		if (previousIndex < 0 || previousIndex >= track.modifiers.length ||
			newIndex < 0 || newIndex >= track.modifiers.length) {
			throw new Error(`Invalid modifier indices for track "${trackName}"`);
		}

		const [movedModifier] = track.modifiers.splice(previousIndex, 1);
		track.modifiers.splice(newIndex, 0, movedModifier);
	}

	toJSON() {
		const data = {};

		for (const [trackName, track] of this.tracks.entries()) {
			data[trackName] = track.toJSON();
		}
		return data;
	}

	fromJSON(data) {
		// Clear existing tracks
		this.tracks.clear();

		for (const trackName in data) {
			let track = Track.fromJSON(trackName, data[trackName]);
			this.addTrack(track);
		}
		return this;
	}
}

module.exports = { ModifierPipeline, Track };