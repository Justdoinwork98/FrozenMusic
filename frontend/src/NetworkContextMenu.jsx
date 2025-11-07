import React, { useState, useEffect, useRef } from "react";
import "./NetworkContextMenu.css";

export const NetworkContextMenu = ({ x, y, onClose, onSelect, possibleNodes }) => {
	const [submenu, setSubmenu] = useState(null);
	const ref = useRef(null);

	useEffect(() => {
		const handleClickOutside = (e) => {
			if (ref.current && !ref.current.contains(e.target)) onClose();
		};
		window.addEventListener("click", handleClickOutside);
		return () => window.removeEventListener("click", handleClickOutside);
	}, [onClose]);

	return (
		<div
			className="context-menu"
			style={{ top: y, left: x }}
			ref={ref}
		>
			{Object.keys(possibleNodes).map((category) => (
				<div
					key={category}
					className="menu-item"
					onMouseEnter={() => setSubmenu(category)}
				>
					{category}
					{submenu === category && (
						<div className="submenu" onMouseLeave={() => setSubmenu(null)}>
							{possibleNodes[category].map((nodeType) => (
								<div
									key={nodeType}
									className="submenu-item"
									onClick={() => { onSelect(nodeType) }}
								>
									{nodeType}
								</div>
							))}
						</div>
					)}
				</div>
			))}
		</div>
	);
};


export default NetworkContextMenu;
