#!/bin/bash

# Set proper URL for text editor
TEXT_EDITOR_URL="http://localhost:5175/document/2"

# Check which browser command to use based on OS
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  open "$TEXT_EDITOR_URL"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  xdg-open "$TEXT_EDITOR_URL" || firefox "$TEXT_EDITOR_URL" || google-chrome "$TEXT_EDITOR_URL" || echo "Cannot open browser automatically. Please visit $TEXT_EDITOR_URL manually."
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  # Windows with Git Bash or similar
  start "$TEXT_EDITOR_URL"
else
  # Generic fallback
  echo "Please open this URL in your browser: $TEXT_EDITOR_URL"
fi

echo "Opening text editor at: $TEXT_EDITOR_URL"
echo "If the browser doesn't open automatically, please copy and paste the URL into your browser."
echo "Use keyboard shortcuts in the editor:"
echo "  - Ctrl+B: Bold text"
echo "  - Ctrl+I: Italic text"
echo "  - Ctrl+U: Underline text"
echo "  - Ctrl+Z: Undo"
echo "  - Ctrl+Shift+Z: Redo" 