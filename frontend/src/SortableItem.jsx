import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableItem({ id, modifier, isExpanded, onToggleExpand }) {
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
					{Object.keys(modifier.parameters).map((key) => (
						<p> {key}: {modifier.parameters[key]}</p>,
						<div key={key} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
							<label>{key}</label>
							<input type="text" defaultValue={modifier.parameters[key]} onClick={(e) => e.stopPropagation()} />
						</div>
					))}
				</div>
			)}
		</div>
	);
}

export default SortableItem;
