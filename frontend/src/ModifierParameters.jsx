import { useState, useEffect } from "react";

function ModifierParameters({ modifier, onParameterChange, onFactorChange }) {
	const [parameterState, setParameterState] = useState({});

	const parameterOptions = ["static", "noteNumber", "velocity", "startTime", "duration"];

	// Initialize local state based on modifier
	useEffect(() => {
		const state = {};
		for (const key of Object.keys(modifier.parameters)) {
			console.log("Initializing parameter state for key:", key);
			console.log("Current modifier parameters:", modifier.parameters[key]);
			console.log("Current modifier parameter factors:", modifier.parameterFactors);
			console.log(['noteNumber', 'velocity', 'startTime', 'duration'].includes(modifier.parameters[key]))
			state[key] = {
				source: ['noteNumber', 'velocity', 'startTime', 'duration'].includes(modifier.parameters[key]) ? modifier.parameters[key] : "static",
				factor: modifier.parameterFactors[key] ?? 1,
			};
		}
		setParameterState(state);
	}, [modifier]);

	const handleSourceChange = (key, source) => {
		setParameterState((prev) => ({
			...prev,
			[key]: {
				...prev[key],
				source,
			},
		}));
		if (onParameterChange) {
			onParameterChange(modifier.id, key, source);
		}
	};

	const handleValueChange = (key, val) => {
		setParameterState((prev) => {
			const newVal = Number(val);
			const updated = {
				...prev,
				[key]: {
				...prev[key],
				...(prev[key].source === "static"
					? { value: newVal }
					: { factor: newVal }),
				},
			};
			if (onParameterChange && onFactorChange) {
				if (prev[key].source === "static") {
					onParameterChange(modifier.id, key, newVal);
				} else {
					onFactorChange(modifier.id, key, newVal);
				}
			}
			return updated;
		});
  	};

  	return (
		<div
			style={{
				marginTop: 6,
				padding: 6,
				background: "#8d8282ff",
				borderRadius: 4,
			}}
		>
		{Object.keys(modifier.parameters).map((key) => {
			const { source, factor } = parameterState[key] || {};
			return (
				<div
					key={key}
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						marginBottom: 6,
					}}
				>
					<label style={{ marginRight: 8 }}>{key}</label>
					{/* Dropdown to select parameter source */}
					<select
						value={source}
						onChange={(e) => handleSourceChange(key, e.target.value)}
						style={{ marginRight: 8 }}
						onClick={(e) => e.stopPropagation()}
					>
					{parameterOptions.map((option) => (
						<option key={option} value={option}>
							{option}
						</option>
					))}
					</select>

					{/* Input value / factor */}
					<input
						type="number"
						value={factor}
						step="any"
						onChange={(e) => handleValueChange(key, e.target.value)}
						onClick={(e) => e.stopPropagation()}
						style={{ width: 80, textAlign: "center" }}
					/>
				</div>
			);
		})}
		</div>
	);
}

export default ModifierParameters;
