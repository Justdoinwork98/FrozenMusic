const { Node, InputPoint, OutputPoint } = require('./node.js');

class OutputNode extends Node {
	constructor() {
		const inputs = [
			new InputPoint("Final Mesh", "Mesh", null),
		];
		const outputs = [];
		super("Output", inputs, outputs);
	}

	getOutput(network, midiData, outputIndex) {
		const meshInput = this.getInput(network, 0, midiData);

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
		];
		super("MIDI Input", inputs, outputs);
	}

	getOutput(network, midiData, outputIndex) {
		if (!midiData || !midiData.track || midiData.track.length === 0) {
			throw new Error('No MIDI data available');
		}

		const outputPoint = this.outputs[outputIndex];
		switch (outputIndex) {
			case 0: // Note Number
				return midiData.noteNumber;
			case 1: // Velocity
				return midiData.velocity;
			case 2: // Duration
				return midiData.duration;
			case 3: // Start Time
				return midiData.startTime;
		}
		throw new Error('Invalid output index for MidiInputNode: ' + outputIndex);
	}
}

module.exports = {
	OutputNode,
	MidiInputNode,
};