import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ModifierParameters from "./ModifierParameters";

function SortableItem({ id, trackName, modifier, isExpanded, onToggleExpand }) {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

	const style = {
		transform: CSS.Translate.toString(transform),
		transition,
	};

	// Handle parameter changes
	const onParameterChange = async (modifierId, parameterName, newValue) => {
		await window.electronAPI.modifierParameterChange({
			trackName: trackName,
			modifierId: modifierId,
			parameterName: parameterName,
			newValue: newValue
		});
	};

	const onFactorChange = async (modifierId, parameterName, factor) => {
		await window.electronAPI.modifierParameterFactorChange({
			trackName: trackName,
			modifierId: modifierId,
			parameterName: parameterName,
			factor: factor
		});
	};

	return (
		<div ref={setNodeRef} style={style} className="sidebar-track">
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
						className="sortable-item-handle"
					>
						☰
					</div>
					<div>{modifier.name}</div>
				</div>

				{/* Expand button */}
				<button className="toggle-expanded-modifier-button">
					{isExpanded ? "▲" : "▼"}
				</button>
			</div>

			{isExpanded && (
				<div className="modifier-parameters">
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
