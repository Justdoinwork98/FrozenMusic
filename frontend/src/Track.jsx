import { useState } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";

function Track({ track }) {
  const [expanded, setExpanded] = useState(false);
  const [attributes, setAttributes] = useState([
    { id: track.id + "-attr-1", name: "Volume", settings: { level: 80 }, expanded: false },
    { id: track.id + "-attr-2", name: "Tempo", settings: { bpm: 120 }, expanded: false },
    { id: track.id + "-attr-3", name: "Instrument", settings: { type: "Piano" }, expanded: false },
  ]);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setAttributes((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const toggleAttributeExpand = (id) => {
    setAttributes((items) =>
      items.map((attr) => (attr.id === id ? { ...attr, expanded: !attr.expanded } : attr))
    );
  };

  return (
    <div className="track-container" style={{ 
      width: "95%", 
      marginBottom: 12, 
      border: "1px solid #665e5eff", 
      borderRadius: 8 }}>
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
        <div style={{ 
          padding: 4
          }}>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={attributes} strategy={verticalListSortingStrategy}>
              {attributes.map((attr) => (
                <SortableItem
                  key={attr.id}
                  id={attr.id}
                  attribute={attr}
                  onToggleExpand={() => toggleAttributeExpand(attr.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}

export default Track;
