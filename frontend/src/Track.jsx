import { useState, useEffect } from "react";
import {
	DndContext,
	closestCenter,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	arrayMove,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";

function Track({ track, onUpdateTrack }) {
	const [expanded, setExpanded] = useState(false);
	const [showDropdown, setShowDropdown] = useState(false);
	const [modifierIsExpanded, setModifierIsExpanded] = useState(new Map());

	const sensors = useSensors(useSensor(PointerSensor));

	const handleDragEnd = (event) => {
		const { active, over } = event;
		if (active.id !== over?.id) {
			setAttributes((items) => {
				const oldIndex = items.findIndex((i) => i.id === active.id);
				const newIndex = items.findIndex((i) => i.id === over.id);
				return arrayMove(items, oldIndex, newIndex);
			});
		}
	};

	useEffect(() => {
		setModifierIsExpanded((prev) => {
			const nextState = {};

			// Keep existing expanded states for modifiers that still exist
			for (const modifier of track.modifiers) {
				if (prev.hasOwnProperty(modifier.id)) {
					nextState[modifier.id] = prev[modifier.id];
				} else {
					// New modifier -> start collapsed
					nextState[modifier.id] = false;
				}
			}

			return nextState;
		});
	}, [track.modifiers]);

	const toggleModifierExpand = (id) => {
		setModifierIsExpanded((prev) => ({
			...prev,
			[id]: !prev[id],
		}));
	};

	const addModifier = async (type) => {
		const newTracks = await window.electronAPI.addModifier({
			trackName: track.name,
			modifierName: type,
		});

    	if (onUpdateTrack) onUpdateTrack(newTracks);
	};

	const modifierOptions = ["Translate", "Rotate", "Scale"];

	return (
		<div
			className="track-container"
			style={{
				width: "95%",
				marginBottom: 12,
				border: "1px solid #665e5eff",
				borderRadius: 8,
			}}
		>
			<button
				type="button"
				onClick={() => setExpanded(!expanded)}
				style={{
					width: "100%",
					padding: 8,
					fontWeight: "bold",
					textAlign: "left",
					border: "none",
					background: "#665e5eff",
					cursor: "pointer",
					borderRadius: "8px 8px 0 0",
				}}
			>
				{expanded ? "▼" : "►"} {track.name}
			</button>

			{expanded && (
				<div style={{ padding: 4 }}>
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={handleDragEnd}
					>
						<SortableContext
							items={track.modifiers}
							strategy={verticalListSortingStrategy}
						>
							{console.log("Rendering modifiers for track:", track.modifiers)}
							{
							track.modifiers.map((modifier) => (
								console.log("Modifier:", modifier),
								<SortableItem
									key={modifier.id}
									id={modifier.id}
									trackName={track.name}
									modifier={modifier}
									isExpanded={modifierIsExpanded[modifier.id]}
									onToggleExpand={() => toggleModifierExpand(modifier.id)}
								/>
							))}
						</SortableContext>

						<div style={{ position: "relative", display: "inline-block", width: "100%", textAlign: "center" }}>
							<p
								className="add-modifier-button"
								onClick={() => setShowDropdown(!showDropdown)}
								style={{
									color: "rgba(255, 255, 255, 1)",
									cursor: "pointer",
									margin: "0",
									userSelect: "none",
								}}
							>
								Add Modifier
							</p>

							{showDropdown && (
								<div
									style={{
										position: "absolute",
										background: "#222",
										color: "#fff",
										border: "1px solid #555",
										borderRadius: 6,
										marginTop: 4,
										zIndex: 100,
										minWidth: 120, width: "100%", textAlign: "center"
									}}
								>
									{modifierOptions.map((option) => (
										<div
											key={option}
											onClick={() => addModifier(option)}
											style={{
												padding: "6px 12px",
												cursor: "pointer",
												borderBottom: "1px solid #444",
											}}
											onMouseEnter={(e) =>
												(e.currentTarget.style.background = "#333")
											}
											onMouseLeave={(e) =>
												(e.currentTarget.style.background = "transparent")
											}
										>
											{option}
										</div>
									))}
								</div>
							)}
						</div>
					</DndContext>
				</div>
			)}
		</div>
	);
}

export default Track;
