import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableItem({ id, attribute, onToggleExpand }) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
        padding: "8px",
        width: "90%",
        marginBottom: "6px",
        background: "#665e5eff",
        borderRadius: "8px",
        userSelect: "none",
    };

    return (
        <div ref={setNodeRef} style={style}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                    <div>{attribute.name}</div>
                </div>

                {/* Expand button */}
                <button
                    style = {{background: "#665e5eff",}}
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation(); // prevent drag interference
                        onToggleExpand();
                    }}
                >
                    {attribute.expanded ? "▲" : "▼"}
                </button>
            </div>

            {attribute.expanded && (
                <div style={{ marginTop: 6, padding: 6, background: "#8d8282ff", borderRadius: 4 }}>
                    {Object.entries(attribute.settings).map(([key, value]) => (
                        <div key={key} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <label>{key}</label>
                            <input type="text" defaultValue={value} onClick={(e) => e.stopPropagation()} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SortableItem;
