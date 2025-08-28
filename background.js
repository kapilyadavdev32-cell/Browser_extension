// Background script to handle keyboard shortcuts and extension state
let extensionEnabled = true;
let habitModeEnabled = true;
let advancedModeEnabled = false;

// Initialize extension state on startup
chrome.runtime.onStartup.addListener(() => {
	loadState();
});

// Load state when extension loads
loadState();

// Listen for keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
	console.log("Command received:", command);

	switch (command) {
		case "toggle-extension":
			extensionEnabled = !extensionEnabled;
			saveState();
			broadcastToTabs({ action: "toggleExtension", enabled: extensionEnabled });
			break;
		case "toggle-habit-mode":
			habitModeEnabled = !habitModeEnabled;
			saveState();
			broadcastToTabs({ action: "toggleHabitMode", enabled: habitModeEnabled });
			break;
		case "toggle-advanced-mode":
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				if (tabs[0]) {
					chrome.tabs.sendMessage(tabs[0].id, { action: "toggleAdvancedModeFromCommand" });
				}
			});
			break;
		case "open-advanced-overlay":
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
				if (tabs[0]) {
					chrome.tabs.sendMessage(tabs[0].id, { action: "showAdvancedOverlayPopup" });
				}
			});
			break;
	}
});

// Broadcast message to all active tabs
function broadcastToTabs(message) {
	chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
		tabs.forEach((tab) => {
			chrome.tabs.sendMessage(tab.id, message, (response) => {
				if (chrome.runtime.lastError) {
					// Tab might not have content script loaded yet
					console.log("Tab not ready:", chrome.runtime.lastError.message);
				}
			});
		});
	});
}

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "getState") {
		sendResponse({
			extensionEnabled,
			habitModeEnabled,
			advancedModeEnabled,
		});
	} else if (message.action === "toggleExtension") {
		extensionEnabled = message.enabled;
		saveState();
		broadcastToTabs({ action: "toggleExtension", enabled: extensionEnabled });
	} else if (message.action === "toggleHabitMode") {
		habitModeEnabled = message.enabled;
		saveState();
		broadcastToTabs({ action: "toggleHabitMode", enabled: habitModeEnabled });
	} else if (message.action === "toggleAdvancedMode") {
		advancedModeEnabled = message.enabled;
		saveState();
		broadcastToTabs({ action: "toggleAdvancedMode", enabled: advancedModeEnabled });
	}
});

function loadState() {
	chrome.storage.local.get(
		["extensionEnabled", "habitModeEnabled", "advancedModeEnabled"],
		(result) => {
			extensionEnabled =
				result.extensionEnabled !== undefined ? result.extensionEnabled : true;
			habitModeEnabled =
				result.habitModeEnabled !== undefined ? result.habitModeEnabled : true;
			advancedModeEnabled =
				result.advancedModeEnabled !== undefined ? result.advancedModeEnabled : false;
		}
	);
}

function saveState() {
	chrome.storage.local.set({
		extensionEnabled,
		habitModeEnabled,
		advancedModeEnabled,
	});
}

// Add debug command to context menu
chrome.contextMenus.create({
	id: "debugExtension",
	title: "Debug Extension",
	contexts: ["all"],
});

chrome.contextMenus.create({
	id: "testOverlay",
	title: "Test Overlay",
	contexts: ["all"],
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
	if (info.menuItemId === "debugExtension") {
		chrome.tabs
			.sendMessage(tab.id, { command: "runDebug" })
			.then((response) => {
				console.log("Debug response:", response);
			})
			.catch((error) => {
				console.error("Debug error:", error);
			});
	} else if (info.menuItemId === "testOverlay") {
		chrome.tabs
			.sendMessage(tab.id, { command: "testOverlay" })
			.then((response) => {
				console.log("Test response:", response);
			})
			.catch((error) => {
				console.error("Test error:", error);
			});
	}
});
