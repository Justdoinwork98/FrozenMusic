const { Node, InputPoint, OutputPoint } = require('./node.js');

class OutputNode extends Node {
	constructor() {
		const inputs = [
			new InputPoint("Final Mesh", "Mesh", null),
		];
		const outputs = [];
		super("Output", inputs, outputs);
		this.nodeClass = 'output';
	}

	getOutput(network, data, outputIndex) {
		const meshInput = this.getInput(network, 0, data);

		// TODO empty check
		return meshInput;
	}
}

class MidiInputNode extends Node {
	constructor() {
		const inputs = [];
		const outputs = [
			new OutputPoint("Note Number", "Number"),
			new OutputPoint("Velocity", "Number"),
			new OutputPoint("Duration", "Number"),
			new OutputPoint("Start Time", "Number"),
			new OutputPoint("Note Index", "Number"),
		];
		super("MIDI data", inputs, outputs);
		this.nodeClass = 'midi';
	}

	getOutput(network, data, outputIndex) {
		if (!data || !data.midiData) {
			throw new Error('No MIDI data available');
		}

		const midiData = data.midiData;

		const outputPoint = this.outputs[outputIndex];
		switch (outputIndex) {
			case 0: // Note Number
				return midiData.note;
			case 1: // Velocity
				return midiData.velocity;
			case 2: // Duration
				return midiData.duration;
			case 3: // Start Time
				return midiData.startTime;
			case 4: // Note Index
				return midiData.noteIndex;
		}
		throw new Error('Invalid output index for MidiInputNode: ' + outputIndex);
	}
}

module.exports = {
	OutputNode,
	MidiInputNode,
};