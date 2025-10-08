// main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
	const win = new BrowserWindow({
		width: 1200,
		height: 800,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'), // optional
		},
	});

	// Load the React app (in dev mode or from build)
	if (process.env.NODE_ENV === 'development') {
		win.loadURL('http://localhost:5173'); // Vite dev server
	} else {
		win.loadFile(path.join(__dirname, 'frontend/dist/index.html'));
	}
}

app.whenReady().then(() => {
	createWindow();
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') app.quit();
});
