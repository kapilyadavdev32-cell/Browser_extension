// Minimal Custom Input Everywhere Extension with Habit Mode & Advanced Mode
console.log("✅ Custom Input Everywhere Extension loaded on", window.location.href);

// --- State ---
let extensionEnabled = true;
let habitModeEnabled = true;
let advancedModeEnabled = false;
let overlayBox = null;
let aiOverlay = null;
let activeElement = null;
let isOverlayVisible = false;
let isAiOverlayVisible = false;
let autoSearchElement = null;

initExtension();

function initExtension() {
	createHabitOverlay();
	createAdvancedOverlay();
	setupEventListeners();
	loadState();
}

// --- State Management ---
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

			// Hide overlays if modes are disabled
			if (!extensionEnabled || !habitModeEnabled) {
				hideOverlay();
			}
			if (!extensionEnabled || !advancedModeEnabled) {
				hideAiOverlay();
			}
		}
	);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "toggleExtension") {
		extensionEnabled = message.enabled;
		if (!extensionEnabled) {
			hideOverlay();
			hideAiOverlay();
		}
	} else if (message.action === "toggleHabitMode") {
		habitModeEnabled = message.enabled;
		if (!habitModeEnabled) {
			hideOverlay();
		}
	} else if (message.action === "toggleAdvancedMode") {
		advancedModeEnabled = message.enabled;
		if (advancedModeEnabled) {
			showAiOverlay();
		} else {
			hideAiOverlay();
		}
	} else if (message.action === "toggleAdvancedModeFromCommand") {
		advancedModeEnabled = !advancedModeEnabled;
		if (advancedModeEnabled) showAiOverlay();
		else hideAiOverlay();
		chrome.runtime.sendMessage({ action: "toggleAdvancedMode", enabled: advancedModeEnabled });
	} else if (message.action === "showAdvancedOverlayPopup") {
		if (!isAiOverlayVisible) {
			showAiOverlay();
		}
	}
});

// --- Habit Mode Overlay ---
function createHabitOverlay() {
	if (overlayBox) return; // Already created

	overlayBox = document.createElement("div");
	overlayBox.id = "custom-input-overlay";
	overlayBox.innerHTML = `
		<div class="overlay-header">
			<span>Custom Input Box</span>
			<button class="close-btn" id="closeOverlay">×</button>
		</div>
		<textarea class="overlay-textarea" placeholder="Type here..."></textarea>
		<div class="resize-handle se"></div>
		<div class="resize-handle sw"></div>
		<div class="resize-handle ne"></div>
		<div class="resize-handle nw"></div>
	`;

	document.body.appendChild(overlayBox);

	// Add event listeners
	overlayBox.querySelector("#closeOverlay").onclick = hideOverlay;
	setupOverlayDrag(overlayBox);
	setupOverlayResize(overlayBox);
}

// --- Advanced Mode Overlay ---
function createAdvancedOverlay() {
	if (aiOverlay) return; // Already created

	aiOverlay = document.createElement("div");
	aiOverlay.id = "ai-overlay";
	aiOverlay.innerHTML = `
		<div class="ai-header">
			<span>AI Assistant</span>
			<button class="close-btn" id="closeAiOverlay">×</button>
		</div>
		<div class="ai-content">
			<textarea class="ai-input" placeholder="Describe what you want to change on this page or enter a custom prompt..."></textarea>
			<div class="ai-controls">
				<button class="ai-btn" id="modifyCss">Modify CSS</button>
				<button class="ai-btn" id="summarizeContent">Summarize</button>
				<button class="ai-btn" id="improveText">Improve Text</button>
				<button class="ai-btn" id="extractInfo">Extract Info</button>
				<button class="ai-btn" id="customPrompt">Custom Prompt</button>
			</div>
			<div class="ai-output" id="aiOutput"></div>
		</div>
	`;

	document.body.appendChild(aiOverlay);

	// Add event listeners
	aiOverlay.querySelector("#closeAiOverlay").onclick = hideAiOverlay;
	aiOverlay.querySelector("#modifyCss").onclick = () => {
		const input = aiOverlay.querySelector(".ai-input").value;
		if (input) modifyPageCSS(input);
	};
	aiOverlay.querySelector("#summarizeContent").onclick = () => summarizePageContent();
	aiOverlay.querySelector("#improveText").onclick = () => {
		const input = aiOverlay.querySelector(".ai-input").value;
		if (input) improveText(input);
	};
	aiOverlay.querySelector("#extractInfo").onclick = () => extractInfoFromPage();
	aiOverlay.querySelector("#customPrompt").onclick = () => {
		const input = aiOverlay.querySelector(".ai-input").value;
		if (input) customPromptToLLM(input);
	};

	setupOverlayDrag(aiOverlay);
}

// --- Event Listeners ---
function setupEventListeners() {
	document.addEventListener("focusin", handleFocusIn, true);
	document.addEventListener("click", handleClickOutside, true);
	document.addEventListener("keydown", handleShortcuts);
}

function handleShortcuts(e) {
	// Ctrl+Shift+E: Toggle extension
	if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "e") {
		extensionEnabled = !extensionEnabled;
		if (!extensionEnabled) {
			hideOverlay();
			hideAiOverlay();
		}
		chrome.runtime.sendMessage({ action: "toggleExtension", enabled: extensionEnabled });
	}
	// Ctrl+Shift+H: Toggle Habit Mode
	if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "h") {
		habitModeEnabled = !habitModeEnabled;
		if (!habitModeEnabled) hideOverlay();
		chrome.runtime.sendMessage({ action: "toggleHabitMode", enabled: habitModeEnabled });
	}
	// Ctrl+Shift+A: Toggle Advanced Mode
	if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "a") {
		advancedModeEnabled = !advancedModeEnabled;
		if (advancedModeEnabled) showAiOverlay();
		else hideAiOverlay();
		chrome.runtime.sendMessage({ action: "toggleAdvancedMode", enabled: advancedModeEnabled });
	}
}

// --- Habit Mode Logic ---
function handleFocusIn(e) {
	if (!extensionEnabled || !habitModeEnabled) return;
	const el = e.target;
	if (el.closest("#custom-input-overlay") || el.closest("#ai-overlay")) return;
	if (
		el.tagName === "INPUT" ||
		el.tagName === "TEXTAREA" ||
		el.isContentEditable
	) {
		activeElement = el;
		showOverlay();
		const textarea = overlayBox.querySelector(".overlay-textarea");
		textarea.value = el.isContentEditable ? el.textContent : el.value;
		textarea.focus();
	}
}

function findMainSearchBox() {
	// Heuristics for finding the main search box
	const selectors = [
		'input[type="search"]',
		'input[role*="search" i]',
		'input[aria-label*="search" i]',
		'input[placeholder*="search" i]',
		'input[id*="search" i]',
		'input[class*="search" i]',
		'input[type="text"]',
		'textarea[placeholder*="search" i]',
		'[role="searchbox"]',
	];
	for (const selector of selectors) {
		const el = document.querySelector(selector);
		if (el && el.offsetParent !== null && !el.disabled && !el.readOnly) {
			return el;
		}
	}
	return null;
}

function showOverlayForSearchBox() {
	autoSearchElement = findMainSearchBox();
	if (autoSearchElement) {
		activeElement = autoSearchElement;
		showOverlay();
		const textarea = overlayBox.querySelector('.overlay-textarea');
		textarea.value = autoSearchElement.value || '';
		textarea.focus();
	} else {
		hideOverlay();
	}
}

// On page load, show overlay if search box exists
window.addEventListener('DOMContentLoaded', () => {
	if (extensionEnabled && habitModeEnabled) {
		showOverlayForSearchBox();
	}
});

// Also re-scan when navigating (SPA) or DOM changes
const observer = new MutationObserver(() => {
	if (extensionEnabled && habitModeEnabled) {
		showOverlayForSearchBox();
	}
});
observer.observe(document.body, { childList: true, subtree: true });

function handleInput() {
	const textarea = overlayBox.querySelector('.overlay-textarea');
	if (autoSearchElement) {
		autoSearchElement.value = textarea.value;
		autoSearchElement.dispatchEvent(new Event('input', { bubbles: true }));
	} else if (activeElement) {
		if (activeElement.isContentEditable) {
			activeElement.textContent = textarea.value;
		} else {
			activeElement.value = textarea.value;
		}
		activeElement.dispatchEvent(new Event('input', { bubbles: true }));
	}
}

function handleKeydown(e) {
	if (e.key === 'Enter') {
		if (autoSearchElement) {
			const form = autoSearchElement.closest('form');
			if (form) {
				form.submit();
			} else {
				autoSearchElement.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
			}
			hideOverlay();
			return;
		}
		if (activeElement) {
			const hostname = window.location.hostname.toLowerCase();
			const isChatApp =
				hostname.includes("chat.openai.com") || hostname.includes("chatgpt.com");
			if (isChatApp) {
				let actionTriggered = false;
				const sendButton = document.querySelector(
					'button[data-testid="send-button"], button[aria-label*="send" i], button[title*="send" i]'
				);
				if (sendButton) {
					sendButton.click();
					actionTriggered = true;
				}
				if (!actionTriggered) {
					["keydown", "keypress", "keyup"].forEach((eventType) => {
						const event = new KeyboardEvent(eventType, {
							key: "Enter",
							code: "Enter",
							keyCode: 13,
							which: 13,
							bubbles: true,
							cancelable: true,
						});
						activeElement.dispatchEvent(event);
					});
				}
			} else {
				const isSearchInput =
					activeElement.type === "search" ||
					activeElement.getAttribute("role") === "searchbox" ||
					(activeElement.name && activeElement.name.toLowerCase().includes("search")) ||
					(activeElement.id && activeElement.id.toLowerCase().includes("search")) ||
					(activeElement.className &&
						activeElement.className.toLowerCase().includes("search")) ||
					(activeElement.placeholder &&
						activeElement.placeholder.toLowerCase().includes("search"));
				const form = activeElement.closest && activeElement.closest("form");
				let actionTriggered = false;
				if (isSearchInput || form) {
					if (form) {
						form.submit();
						actionTriggered = true;
					}
					if (!actionTriggered) {
						const searchButton = document.querySelector(
							'input[type="submit"], button[type="submit"], [aria-label*="search" i], [title*="search" i], button[class*="search" i], input[class*="search" i]'
						);
						if (searchButton) {
							searchButton.click();
							actionTriggered = true;
						}
					}
					if (!actionTriggered) {
						["keydown", "keypress", "keyup"].forEach((eventType) => {
							const event = new KeyboardEvent(eventType, {
								key: "Enter",
								code: "Enter",
								keyCode: 13,
								which: 13,
								bubbles: true,
								cancelable: true,
							});
							activeElement.dispatchEvent(event);
						});
					}
				}
			}
		}
		hideOverlay();
	}
}

function handleClickOutside(e) {
	if (e.target.closest("#custom-input-overlay") || e.target.closest("#ai-overlay")) return;
	if (e.target === activeElement) return;
	if (activeElement && activeElement.contains(e.target)) return;
	hideOverlay();
	hideAiOverlay();
}

function showOverlay() {
	if (overlayBox && !isOverlayVisible) {
		overlayBox.style.display = "block";
		isOverlayVisible = true;

		// Add input event listener
		const textarea = overlayBox.querySelector(".overlay-textarea");
		textarea.addEventListener("input", handleInput);
		textarea.addEventListener("keydown", handleKeydown);
	}
}

function hideOverlay() {
	if (overlayBox && isOverlayVisible) {
		overlayBox.style.display = "none";
		isOverlayVisible = false;
		activeElement = null;
	}
}

function showAiOverlay() {
	if (aiOverlay && !isAiOverlayVisible) {
		aiOverlay.style.display = "block";
		isAiOverlayVisible = true;
		aiOverlay.querySelector(".ai-input").focus();
	}
}

function hideAiOverlay() {
	if (aiOverlay && isAiOverlayVisible) {
		aiOverlay.style.display = "none";
		isAiOverlayVisible = false;
	}
}

// --- AI Functions ---
async function modifyPageCSS(description) {
	const output = aiOverlay.querySelector("#aiOutput");
	output.innerHTML = '<p style="color: #666;">Generating CSS modifications...</p>';

	try {
		const apiKey = await getApiKey();
		if (!apiKey) {
			output.innerHTML =
				'<p style="color: red;">❌ Please set your Mistral AI API key in the extension settings</p>';
			return;
		}

		const pageText = extractPageText();
		const prompt = `Based on this page content and the user's request, generate CSS modifications. 
		
Page content: ${pageText.substring(0, 1000)}
User request: ${description}

Generate only valid CSS rules that can be applied to modify the page. Return only the CSS code, no explanations.`;

		const cssRules = await callOpenAI(apiKey, prompt);
		if (cssRules) {
			applyCSS(cssRules);
			output.innerHTML = `<p style="color: green;">✅ CSS applied successfully!</p><pre>${cssRules}</pre>`;
		} else {
			output.innerHTML = '<p style="color: red;">❌ Failed to generate CSS</p>';
		}
	} catch (error) {
		output.innerHTML = `<p style="color: red;">❌ Error: ${error.message}</p>`;
	}
}

async function summarizePageContent() {
	const output = aiOverlay.querySelector("#aiOutput");
	output.innerHTML = '<p style="color: #666;">Generating summary...</p>';

	try {
		const apiKey = await getApiKey();
		if (!apiKey) {
			output.innerHTML =
				'<p style="color: red;">❌ Please set your Mistral AI API key in the extension settings</p>';
			return;
		}

		const pageText = extractPageText();
		const prompt = `Summarize the following web page content in a clear and concise way:

${pageText.substring(0, 2000)}

Provide a well-structured summary with key points.`;

		const summary = await callOpenAI(apiKey, prompt);
		if (summary) {
			output.innerHTML = `<p style="color: green;">✅ Summary generated:</p><p>${summary}</p>`;
		} else {
			output.innerHTML = '<p style="color: red;">❌ Failed to generate summary</p>';
		}
	} catch (error) {
		output.innerHTML = `<p style="color: red;">❌ Error: ${error.message}</p>`;
	}
}

async function improveText(text) {
	const output = aiOverlay.querySelector("#aiOutput");
	output.innerHTML = '<p style="color: #666;">Improving text...</p>';

	try {
		const apiKey = await getApiKey();
		if (!apiKey) {
			output.innerHTML =
				'<p style="color: red;">❌ Please set your Mistral AI API key in the extension settings</p>';
			return;
		}

		const prompt = `Improve the following text by making it more clear, professional, and engaging:

"${text}"

Return only the improved text, no explanations.`;

		const improvedText = await callOpenAI(apiKey, prompt);
		if (improvedText) {
			output.innerHTML = `<p style="color: green;">✅ Improved text:</p><p>${improvedText}</p>`;
		} else {
			output.innerHTML = '<p style="color: red;">❌ Failed to improve text</p>';
		}
	} catch (error) {
		output.innerHTML = `<p style="color: red;">❌ Error: ${error.message}</p>`;
	}
}

function extractPageText() {
	const body = document.body.cloneNode(true);
	// Remove script and style elements
	const scripts = body.querySelectorAll(
		"script, style, nav, header, footer, .ad, .advertisement"
	);
	scripts.forEach((el) => el.remove());
	return body.textContent.trim().replace(/\s+/g, " ");
}

function applyCSS(cssRules) {
	let style = document.getElementById("custom-input-extension-style");
	if (!style) {
		style = document.createElement("style");
		style.id = "custom-input-extension-style";
		document.head.appendChild(style);
	}
	style.textContent = cssRules;
}

async function getApiKey() {
	return new Promise((resolve) => {
		chrome.storage.local.get(["mistralApiKey"], function (result) {
			resolve(result.mistralApiKey);
		});
	});
}

async function callOpenAI(apiKey, prompt, retryCount = 0) {
	try {
		const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
				"Accept": "application/json",
			},
			body: JSON.stringify({
				model: "mistral-large-latest",
				messages: [{ role: "user", content: prompt }],
				max_tokens: 1000,
				temperature: 0.7,
			}),
		});

		if (!response.ok) {
			throw new Error(`API request failed: ${response.status}`);
		}

		const data = await response.json();
		return data.choices[0]?.message?.content?.trim();
	} catch (error) {
		console.error("Mistral AI API error:", error);
		if (retryCount < 2) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			return callOpenAI(apiKey, prompt, retryCount + 1);
		}
		throw error;
	}
}

// --- Overlay Utilities ---
function setupOverlayDrag(overlay) {
	const header = overlay.querySelector(".overlay-header, .ai-header");
	let isDragging = false;
	let startX, startY, startLeft, startTop;

	header.addEventListener("mousedown", (e) => {
		isDragging = true;
		startX = e.clientX;
		startY = e.clientY;
		startLeft = parseInt(overlay.style.left) || 0;
		startTop = parseInt(overlay.style.top) || 0;
		header.classList.add("dragging");
		e.preventDefault();
	});

	document.addEventListener("mousemove", (e) => {
		if (!isDragging) return;

		const deltaX = e.clientX - startX;
		const deltaY = e.clientY - startY;

		overlay.style.left = startLeft + deltaX + "px";
		overlay.style.top = startTop + deltaY + "px";
	});

	document.addEventListener("mouseup", () => {
		isDragging = false;
		header.classList.remove("dragging");
	});
}

function setupOverlayResize(overlay) {
	const handles = overlay.querySelectorAll(".resize-handle");

	handles.forEach((handle) => {
		handle.addEventListener("mousedown", (e) => {
			e.preventDefault();
			const startX = e.clientX;
			const startY = e.clientY;
			const startWidth = overlay.offsetWidth;
			const startHeight = overlay.offsetHeight;
			const startLeft = overlay.offsetLeft;
			const startTop = overlay.offsetTop;

			const isResizing = true;
			handle.classList.add("resizing");

			function onMouseMove(e) {
				const deltaX = e.clientX - startX;
				const deltaY = e.clientY - startY;

				if (handle.classList.contains("se")) {
					overlay.style.width = Math.max(280, startWidth + deltaX) + "px";
					overlay.style.height = Math.max(120, startHeight + deltaY) + "px";
				} else if (handle.classList.contains("sw")) {
					const newWidth = Math.max(280, startWidth - deltaX);
					overlay.style.width = newWidth + "px";
					overlay.style.left = startLeft + startWidth - newWidth + "px";
					overlay.style.height = Math.max(120, startHeight + deltaY) + "px";
				} else if (handle.classList.contains("ne")) {
					overlay.style.width = Math.max(280, startWidth + deltaX) + "px";
					const newHeight = Math.max(120, startHeight - deltaY);
					overlay.style.height = newHeight + "px";
					overlay.style.top = startTop + startHeight - newHeight + "px";
				} else if (handle.classList.contains("nw")) {
					const newWidth = Math.max(280, startWidth - deltaX);
					overlay.style.width = newWidth + "px";
					overlay.style.left = startLeft + startWidth - newWidth + "px";
					const newHeight = Math.max(120, startHeight - deltaY);
					overlay.style.height = newHeight + "px";
					overlay.style.top = startTop + startHeight - newHeight + "px";
				}
			}

			function onMouseUp() {
				handle.classList.remove("resizing");
				document.removeEventListener("mousemove", onMouseMove);
				document.removeEventListener("mouseup", onMouseUp);
			}

			document.addEventListener("mousemove", onMouseMove);
			document.addEventListener("mouseup", onMouseUp);
		});
	});
}

async function extractInfoFromPage() {
	const output = aiOverlay.querySelector("#aiOutput");
	output.innerHTML = '<p style="color: #666;">Extracting information...</p>';

	try {
		const apiKey = await getApiKey();
		if (!apiKey) {
			output.innerHTML =
				'<p style="color: red;">❌ Please set your OpenAI API key in the extension settings</p>';
			return;
		}

		const pageText = extractPageText();
		const prompt = `Extract the most important information, facts, entities, and contact details (emails, phone numbers, links) from the following web page content. Present the results in a clear, structured format.\n\n${pageText.substring(0, 3000)}`;

		const info = await callOpenAI(apiKey, prompt);
		if (info) {
			output.innerHTML = `<p style="color: green;">✅ Extracted Information:</p><pre>${info}</pre>`;
		} else {
			output.innerHTML = '<p style="color: red;">❌ Failed to extract information</p>';
		}
	} catch (error) {
		output.innerHTML = `<p style="color: red;">❌ Error: ${error.message}</p>`;
	}
}

async function customPromptToLLM(promptText) {
	const output = aiOverlay.querySelector("#aiOutput");
	output.innerHTML = '<p style="color: #666;">Processing custom prompt...</p>';

	try {
		const apiKey = await getApiKey();
		if (!apiKey) {
			output.innerHTML =
				'<p style="color: red;">❌ Please set your OpenAI API key in the extension settings</p>';
			return;
		}

		const pageText = extractPageText();
		const prompt = `You are an assistant for web page analysis. The user prompt is: "${promptText}"\n\nHere is the web page content for context:\n\n${pageText.substring(0, 3000)}`;

		const result = await callOpenAI(apiKey, prompt);
		if (result) {
			output.innerHTML = `<p style="color: green;">✅ Result:</p><pre>${result}</pre>`;
		} else {
			output.innerHTML = '<p style="color: red;">❌ Failed to process custom prompt</p>';
		}
	} catch (error) {
		output.innerHTML = `<p style="color: red;">❌ Error: ${error.message}</p>`;
	}
}
