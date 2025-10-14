import { useState } from "react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import Track from "./Track";
import "./Sidebar.css";

function Sidebar() {
  const [filePath, setFilePath] = useState(null);

  const [tracks, setTracks] = useState([
    { id: "track-1", name: "Track 1" },
    { id: "track-2", name: "Track 2" },
  ]);

  const openFile = async () => {
    const path = await window.electronAPI.openFileDialog({
      title: "Select a MIDI file",
      filters: [{ name: "MIDI Files", extensions: ["mid", "midi"] }],
    });
    setFilePath(path);
  };

  return (
    <div className="sidebar">
      <h2>Sidebar</h2>
      <button onClick={openFile} className="upload-btn">
        🎵 Upload MIDI File
      </button>

      {filePath && (
        <div className="file-info">
          <p><strong>Loaded file:</strong></p>
          <p className="file-path">{filePath}</p>
        </div>
      )}

      <h3>Tracks</h3>
      {tracks.map((track) => (
        <Track key={track.id} track={track} />
      ))}
    </div>
  );
}

export default Sidebar;
