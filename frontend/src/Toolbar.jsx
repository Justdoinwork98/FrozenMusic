import React, { useState, useEffect } from "react";
import "./Toolbar.css";

export default function Toolbar() {
	const [openMenu, setOpenMenu] = useState(null);
	const [projectName, setProjectName] = useState("Untitled");

	const toggleMenu = (menuName) => {
		setOpenMenu(openMenu === menuName ? null : menuName);
	};

	const closeMenus = () => setOpenMenu(null);

	const getSaveData = () => {
		const cameraState = window.getPreviewCameraState();
		return {
			camera: cameraState,
		};
	}

	const onSave = () => {
		const saveData = getSaveData();
		window.electronAPI.saveProject(saveData);
		closeMenus();
	}

	const onSaveAs = () => {
		const saveData = getSaveData();
		window.electronAPI.saveProjectAs(saveData);
		closeMenus();
	}

	const onOpen = () => {
		window.electronAPI.openProject();
		closeMenus();
	}

	const onExportMeshAsObj = () => {
		window.electronAPI.saveMeshAsObj();
		closeMenus();
	}

	const onExportMeshAsStl = () => {
		window.electronAPI.saveMeshAsStl();
		closeMenus();
	}

	// Subscribe to project name updates from the backend
	useEffect(() => {
		window.electronAPI.onProjectNameUpdate((name) => {
			setProjectName(name);
		});
		
		// Request the current project name on mount
		window.electronAPI.requestProjectName();
	}, []);

	return (
		<div className="toolbar" onMouseLeave={closeMenus}>
			<div className="menu-item" onClick={() => toggleMenu("file")}>
				File
				{openMenu === "file" && (
					<div className="dropdown">
						<div className="dropdown-item" onClick={onSave}>
							Save
						</div>
						<div className="dropdown-item" onClick={onSaveAs}>
							Save As…
						</div>
						<div className="dropdown-item" onClick={onOpen}>
							Open…
						</div>
					</div>
				)}
			</div>
			<div className="menu-item" onClick={() => toggleMenu("export")}>
				Export
				{openMenu === "export" && (
					<div className="dropdown">
						<div className="dropdown-item" onClick={onExportMeshAsObj}>
							Export As OBJ…
						</div>
						<div className="dropdown-item" onClick={onExportMeshAsStl}>
							Export As STL…
						</div>
					</div>
				)}
			</div>

			{/* Example of how you'd add more menus later */}
			{/* 
			<div className="menu-item" onClick={() => toggleMenu("edit")}>
				Edit ▾
				{openMenu === "edit" && (
					<div className="dropdown">
						<div className="dropdown-item">Undo</div>
						<div className="dropdown-item">Redo</div>
					</div>
				)}
			</div> 
			*/}
			<div className="project-name">
				{projectName}
			</div>
		</div>
	);
}
