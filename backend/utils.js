const path = require("path");

function absoluteToRelativePath(absolutePath) {
	const projectRoot = path.resolve(__dirname, "../"); // adjust to your project structure
	const relativePath = path.relative(projectRoot, absolutePath);
	return relativePath;
}

module.exports = { absoluteToRelativePath };