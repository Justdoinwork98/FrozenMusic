import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ModifierParameters from "./ModifierParameters";

function SortableItem({ id, trackName, modifier, isExpanded, onToggleExpand }) {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

	const style = {
		transform: CSS.Translate.toString(transform),
		transition,
		padding: "0px",
		width: "100%",
		marginBottom: "6px",
		background: "#665e5eff",
		borderRadius: "8px",
		userSelect: "none",
	};

	// Handle parameter changes
	const onParameterChange = async (modifierId, parameterName, newValue) => {
		console.log(`Parameter change for track "${trackName}" modifier index ${modifierId}, parameter "${parameterName}":`, newValue);
		await window.electronAPI.modifierParameterChange({
			trackName: trackName,
			modifierId: modifierId,
			parameterName: parameterName,
			newValue: newValue
		});
	};

	const onFactorChange = async (modifierId, parameterName, factor) => {
		console.log(`Factor change for track "${trackName}" modifier id ${modifierId}, parameter "${parameterName}":`, factor);
		await window.electronAPI.modifierParameterFactorChange({
			trackName: trackName,
			modifierId: modifierId,
			parameterName: parameterName,
			factor: factor
		});
	};

	return (
		<div ref={setNodeRef} style={style}>
			<div onClick={(e) => {
						e.stopPropagation(); // prevent drag interference
						onToggleExpand();
					}}
					style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", padding: "6px" }}>
				<div style={{ display: "flex", alignItems: "center", gap: 8 }}>
					{/* Drag handle */}
					<div
						{...attributes}
						{...listeners}
						style={{
							width: 24,
							height: 24,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							background: "#665e5eff",
							borderRadius: 4,
							cursor: "grab",
						}}
					>
						☰
					</div>
					<div>{modifier.name}</div>
				</div>

				{/* Expand button */}
				<button class="toggle-expanded-modifier-button">
					{isExpanded ? "▲" : "▼"}
				</button>
			</div>

			{isExpanded && (
				<div style={{ marginTop: 6, padding: 6, background: "#8d8282ff", borderRadius: 4 }}>
					<ModifierParameters
						modifier={modifier}
						onParameterChange={onParameterChange}
						onFactorChange={onFactorChange}
					/>
				</div>
			)}
		</div>
	);
}

export default SortableItem;
