import { useEffect, useState } from "react";
import './Sidebar.css'

function Sidebar() {
	const [filePath, setFilePath] = useState(null);

	const openFile = async () => {
		const path = await window.electronAPI.openFileDialog({
			title: "Select a file",
			filters: [
				{ name: 'Midi Files', extensions: ['mid'] },
			]
		});
		setFilePath(path);
	};

	useEffect(() => {
		console.log("App rendered or filePath changed");
	}, [filePath]);

    return (
    <>
        <div className="sidebar">
            <p>sidebar area</p>
        </div>
    </>
    )
}

export default Sidebar
