// Popup script to handle user interactions
document.addEventListener("DOMContentLoaded", function () {
	const extensionToggle = document.getElementById("extensionToggle");
	const habitModeToggle = document.getElementById("habitModeToggle");
	const advancedModeToggle = document.getElementById("advancedModeToggle");
	const apiKeySection = document.getElementById("apiKeySection");
	const apiKeyInput = document.getElementById("apiKeyInput");
	const saveApiKeyBtn = document.getElementById("saveApiKey");

	// Load current state
	loadState();

	// Extension toggle
	extensionToggle.addEventListener("click", function () {
		const newState = !extensionToggle.classList.contains("active");
		extensionToggle.classList.toggle("active", newState);

		chrome.runtime.sendMessage({
			action: "toggleExtension",
			enabled: newState,
		});
		saveState();
	});

	// Habit mode toggle
	habitModeToggle.addEventListener("click", function () {
		const newState = !habitModeToggle.classList.contains("active");
		habitModeToggle.classList.toggle("active", newState);

		chrome.runtime.sendMessage({
			action: "toggleHabitMode",
			enabled: newState,
		});
		saveState();
	});

	// Advanced mode toggle
	advancedModeToggle.addEventListener("click", function () {
		const newState = !advancedModeToggle.classList.contains("active");
		advancedModeToggle.classList.toggle("active", newState);

		chrome.runtime.sendMessage({
			action: "toggleAdvancedMode",
			enabled: newState,
		});

		// Show/hide API key section with animation
		if (newState) {
			apiKeySection.classList.add("show");
		} else {
			apiKeySection.classList.remove("show");
		}
		saveState();
	});

	// Load saved API key
	chrome.storage.local.get(["mistralApiKey"], function (result) {
		if (result.mistralApiKey) {
			apiKeyInput.value = result.mistralApiKey;
		}
	});

	// Save API key
	saveApiKeyBtn.addEventListener("click", function () {
		const apiKey = apiKeyInput.value.trim();
		if (!apiKey) {
			showStatus("Please enter an API key", false);
			return;
		}
		// No prefix check for Mistral
		chrome.storage.local.set({ mistralApiKey: apiKey }, function () {
			showStatus("API key saved successfully!", true);
			// Test the API key
			testApiKey(apiKey);
		});
	});

	// Enter key to save API key
	apiKeyInput.addEventListener("keypress", function (e) {
		if (e.key === "Enter") {
			saveApiKeyBtn.click();
		}
	});

	function loadState() {
		chrome.runtime.sendMessage({ action: "getState" }, function (response) {
			if (response) {
				extensionToggle.classList.toggle("active", response.extensionEnabled);
				habitModeToggle.classList.toggle("active", response.habitModeEnabled);
				advancedModeToggle.classList.toggle("active", response.advancedModeEnabled);

				// Show API key section if advanced mode is enabled
				if (response.advancedModeEnabled) {
					apiKeySection.classList.add("show");
				}
			}
		});

		// Also load from storage as fallback
		chrome.storage.local.get(
			["extensionEnabled", "habitModeEnabled", "advancedModeEnabled", "mistralApiKey"],
			function (result) {
				if (result.extensionEnabled !== undefined) {
					extensionToggle.classList.toggle("active", result.extensionEnabled);
				}
				if (result.habitModeEnabled !== undefined) {
					habitModeToggle.classList.toggle("active", result.habitModeEnabled);
				}
				if (result.advancedModeEnabled !== undefined) {
					advancedModeToggle.classList.toggle("active", result.advancedModeEnabled);
					if (result.advancedModeEnabled) {
						apiKeySection.classList.add("show");
					}
				}

				// Load saved API key
				if (result.mistralApiKey) {
					apiKeyInput.value = result.mistralApiKey;
				}
			}
		);
	}

	function saveState() {
		const state = {
			extensionEnabled: extensionToggle.classList.contains("active"),
			habitModeEnabled: habitModeToggle.classList.contains("active"),
			advancedModeEnabled: advancedModeToggle.classList.contains("active"),
		};

		chrome.storage.local.set(state);
	}

	async function testApiKey(apiKey) {
		try {
			const response = await fetch("https://api.mistral.ai/v1/models", {
				headers: {
					Authorization: `Bearer ${apiKey}`,
					"Content-Type": "application/json",
					"Accept": "application/json",
				},
			});
			if (response.ok) {
				showStatus("API key is valid! ✅", true);
			} else {
				showStatus("API key validation failed. Please check your key.", false);
			}
		} catch (error) {
			showStatus("API key validation failed. Please check your key.", false);
		}
	}

	function showStatus(message, isSuccess) {
		const status = document.getElementById("status");
		status.textContent = message;
		status.className = "status " + (isSuccess ? "success" : "error");
		status.style.display = "block";

		// Hide the message after 4 seconds
		setTimeout(() => {
			status.style.display = "none";
		}, 4000);
	}

	// Add hover effects for better UX
	[extensionToggle, habitModeToggle, advancedModeToggle].forEach((toggle) => {
		toggle.addEventListener("mouseenter", function () {
			if (!this.classList.contains("active")) {
				this.style.background = "rgba(255, 255, 255, 0.3)";
			}
		});

		toggle.addEventListener("mouseleave", function () {
			if (!this.classList.contains("active")) {
				this.style.background = "rgba(255, 255, 255, 0.2)";
			}
		});
	});
});
