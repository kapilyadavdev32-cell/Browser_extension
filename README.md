# Custom Input Everywhere - Browser Extension

A powerful browser extension that brings focus-friendly typing with AI-powered enhancements. Say goodbye to input boxes stuck at the bottom of the screen!

# Features

# Habit Mode

-   Floating Input Box: When you focus on any text input, a beautiful floating input box appears at the top of the screen
-   Real-time Sync: Whatever you type in the floating box is instantly synced with the original input
-   Smart Positioning: The overlay appears at eye level, making typing comfortable and efficient
-   Universal Compatibility: Works with text inputs, textareas, and contenteditable elements

# Advanced Mode (AI-Powered)

-   CSS Modification: Use natural language to modify page styling and layout
-   Content Summarization: Get AI-generated summaries of webpage content
-   Information Extraction: Extract key information from pages automatically
-   Mistral AI Integration: Powered by Mistral AI api for intelligent page manipulation

### Keyboard Shortcuts

-   `Ctrl+Shift+X` - Toggle extension on/off
-   `Ctrl+Shift+H` - Toggle Habit Mode
-   `Ctrl+Shift+A` - Toggle Advanced Mode
-   `Ctrl+Shift+Y` - Show/hide AI overlay (when Advanced Mode is enabled)

# Installation

# For Firefox:

1. Download or clone this repository
2. Open Firefox and go to `about:debugging`
3. Click "This Firefox" in the sidebar
4. Click "Load Temporary Add-on"
5. Select the `manifest.json` file from this folder
6. The extension is now installed and active!

# For Chrome/Edge:

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the folder containing this extension
6. The extension is now installed and active!

# Usage

# Basic Usage (Habit Mode)

1. Navigate to any website with text inputs
2. Click on any text input, textarea, or contenteditable element
3. A floating input box will appear at the top of the screen
4. Type in the floating box - it syncs with the original input in real-time
5. Press Enter to submit or click outside to close

# Advanced Usage (AI Mode)

1. Enable Advanced Mode in the extension popup
2. Set your Mistral AI API key in the popup settings
3. Use `Ctrl+Shift+Y` to open the AI overlay
4. Choose from three AI features:
    - **Modify CSS**: Describe layout changes in natural language
    - **Summarize Content**: Get AI-generated page summaries
    - **Extract Info**: Extract key information from the page

# Configuration

# Extension Popup

Click the extension icon in your browser toolbar to access:

-   Enable/disable the extension
-   Toggle Habit Mode
-   Toggle Advanced Mode
-   Set Mistral AI API key (for Advanced Mode)
-   View keyboard shortcuts

# Settings

The extension remembers your preferences across browser sessions:

-   Extension state (enabled/disabled)
-   Mode preferences (Habit/Advanced)
-   API key (stored securely in browser storage)

# Technical Details

# Architecture

-   Manifest V3: Modern extension architecture
-   Content Scripts: Inject functionality into web pages
-   Background Script: Handle keyboard shortcuts and state management
-   Popup Interface: User-friendly settings panel

# Permissions

-   `activeTab`: Access to current tab
-   `scripting`: Inject scripts into pages
-   `storage`: Save user preferences
-   `tabs`: Communicate with tabs

# Browser Compatibility

-   ✅ Firefox (Manifest V3)
-   ✅ Chrome (Manifest V3)
-   ✅ Edge (Manifest V3)
-   ✅ Other Chromium-based browsers

# Customization

# Styling

The extension uses modern CSS with:

-   Responsive design for mobile devices
-   Smooth animations and transitions
-   Professional color scheme
-   Custom scrollbars

# Positioning

-   Habit Mode overlay: Top center of screen
-   AI overlay: Center of screen
-   Both overlays are responsive and work on mobile

# Troubleshooting

# Common Issues

1. Extension not working: Check if it's enabled in the popup
2. AI features not working: Ensure you've set a valid OpenAI API key
3. Overlay not appearing: Try refreshing the page
4. Keyboard shortcuts not working: Check browser shortcuts settings

# API Key Setup

1. Get an Mistral AI API key from (https://console.mistral.ai/billing/)
2. Open the extension popup
3. Enable Advanced Mode
4. Enter your API key and click "Save"
5. The AI features will now work!



