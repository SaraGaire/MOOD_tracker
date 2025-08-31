# MOOD_tracker
## 📂 Project Structure


#src/
#└── 📁 components/
#├── 📁 MoodTracker/
#│ ├── 📄 MoodTracker.jsx # Main parent component
#| ├── 📄 MoodOptions.js # Mood options data
#│ ├── 📄 MoodTrackerTab.jsx # UI for tracking moods
#│ ├── 📄 GraphsTab.jsx # Graphs UI
#│ ├── 📄 AnalyticsTab.jsx # Analytics List UI
#│ ├── 📄 ChatTab.jsx # Chat UI
#│ ├── 📄 SummaryTab.jsx # AI insights + quick stats
#│ ├── 📄 helpers.js # Utility functions (averages, distributions, streaks, etc.)
#│ └── 📄 aiResponses.js # AI mood-based responses

This is the backend server for MoodBot, built with Node.js + Express. It powers the mood tracking app by handling:

🎭 Mood tracking → Save, update, and retrieve user mood entries.

📊 Analytics → Generate weekly trends, mood distributions, and daily/hourly insights.

💬 AI Chat → Provide supportive responses based on the user’s mood and messages.

🧪 Sample data → Auto-generate demo moods for new users.

🛠 REST API → Includes endpoints for moods, analytics, chat, and health checks.

The backend currently uses an in-memory database (for demo/testing), but can be extended to use MongoDB, PostgreSQL, or any persistent database in production.

# Install dependencies
npm install express cors uuid

# Run the server
node server.js
# Server runs on http://localhost:5000

# Install dependencies  
npm install react recharts lucide-react

# The React component connects to the API
# Currently in demo mode with mock responses
