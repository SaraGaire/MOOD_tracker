// server.js - MoodBot Backend API
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory database (replace with MongoDB/PostgreSQL in production).
let moodDatabase = {
  users: {},
  moods: [],
  chatSessions: {}
};

// Mood options configuration
const MOOD_OPTIONS = [
  { value: 'very-happy', label: 'Very Happy', emoji: '😍', score: 5, color: '#ec4899' },
  { value: 'happy', label: 'Happy', emoji: '😊', score: 4, color: '#10b981' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', score: 3, color: '#f59e0b' },
  { value: 'sad', label: 'Sad', emoji: '😢', score: 2, color: '#3b82f6' },
  { value: 'anxious', label: 'Anxious', emoji: '😰', score: 1, color: '#f97316' },
  { value: 'tired', label: 'Tired', emoji: '😴', score: 2, color: '#6b7280' }
];

// AI Response templates
const AI_RESPONSES = {
  'very-happy': [
    "That's wonderful! What's bringing you so much joy today?",
    "I love seeing you this happy! Keep riding that positive wave! 🌟",
    "Your happiness is contagious! Tell me more about what's going right!"
  ],
  'happy': [
    "Great to hear you're feeling good! What's contributing to your positive mood?",
    "Happy days are the best! Is there something special that happened?",
    "I'm glad you're in a good place today. What's been working well for you?"
  ],
  'neutral': [
    "Neutral can be perfectly fine too. How are things going overall?",
    "Sometimes steady is good. Is there anything you'd like to talk about?",
    "A calm, balanced mood is valuable. What's on your mind today?"
  ],
  'sad': [
    "I'm sorry you're feeling down today. Would you like to talk about what's bothering you?",
    "Sadness is a natural emotion. I'm here to listen if you need support.",
    "It's okay to feel sad sometimes. What might help you feel a little better today?"
  ],
  'anxious': [
    "Anxiety can be tough. What's making you feel worried right now?",
    "I understand anxiety can be overwhelming. Let's talk through what's on your mind.",
    "Take a deep breath. What's causing you to feel anxious today?"
  ],
  'tired': [
    "Feeling tired is your body's way of asking for rest. Have you been getting enough sleep?",
    "Fatigue can affect everything. What's been draining your energy lately?",
    "Rest is important. Is this physical tiredness or emotional exhaustion?"
  ]
};

// Utility functions
const generateSampleData = (userId) => {
  const sampleData = [];
  const moods = ['very-happy', 'happy', 'neutral', 'sad', 'anxious', 'tired'];
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const entriesPerDay = Math.floor(Math.random() * 3) + 1;
    for (let j = 0; j < entriesPerDay; j++) {
      const randomMood = moods[Math.floor(Math.random() * moods.length)];
      const hour = 8 + Math.floor(Math.random() * 12);
      const minute = Math.floor(Math.random() * 60);
      
      sampleData.push({
        id: uuidv4(),
        userId,
        mood: randomMood,
        note: j === 0 ? `Sample note for ${date.toDateString()}` : '',
        date: date.toISOString().split('T')[0],
        time: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        timestamp: new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute).toISOString(),
        createdAt: new Date().toISOString()
      });
    }
  }
  
  return sampleData;
};

const getAIResponse = (mood, message = '') => {
  if (message) {
    // Context-aware responses based on keywords
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('better') || lowerMessage.includes('good')) {
      return "That's great to hear! What's helping you feel better?";
    } else if (lowerMessage.includes('stressed') || lowerMessage.includes('overwhelmed')) {
      return "Stress can be really challenging. Have you tried any relaxation techniques like deep breathing or taking a short walk?";
    } else if (lowerMessage.includes('sleep') || lowerMessage.includes('tired')) {
      return "Sleep is so important for mood. Try to maintain a consistent sleep schedule if possible.";
    } else if (lowerMessage.includes('work') || lowerMessage.includes('job')) {
      return "Work stress is common. Remember to take breaks and set boundaries when you can.";
    } else if (lowerMessage.includes('thank')) {
      return "You're very welcome! I'm always here when you need support. 💙";
    }
    return "I hear you. Can you tell me more about that?";
  }
  
  const responses = AI_RESPONSES[mood] || AI_RESPONSES['neutral'];
  return responses[Math.floor(Math.random() * responses.length)];
};

// API Routes

// Get mood options
app.get('/api/mood-options', (req, res) => {
  res.json({ success: true, data: MOOD_OPTIONS });
});

// Initialize user with sample data
app.post('/api/users/:userId/initialize', (req, res) => {
  const { userId } = req.params;
  
  if (!moodDatabase.users[userId]) {
    moodDatabase.users[userId] = {
      id: userId,
      createdAt: new Date().toISOString(),
      settings: { notifications: true, theme: 'light' }
    };
    
    // Generate sample data
    const sampleMoods = generateSampleData(userId);
    moodDatabase.moods.push(...sampleMoods);
  }
  
  res.json({ 
    success: true, 
    data: { user: moodDatabase.users[userId] },
    message: 'User initialized successfully' 
  });
});

// Save new mood entry
app.post('/api/moods', (req, res) => {
  try {
    const { userId, mood, note } = req.body;
    
    if (!userId || !mood) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID and mood are required' 
      });
    }
    
    if (!MOOD_OPTIONS.find(option => option.value === mood)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid mood value' 
      });
    }
    
    const now = new Date();
    const newMood = {
      id: uuidv4(),
      userId,
      mood,
      note: note || '',
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: now.toISOString(),
      createdAt: now.toISOString()
    };
    
    moodDatabase.moods.push(newMood);
    
    // Generate AI response
    const aiResponse = getAIResponse(mood);
    
    res.status(201).json({ 
      success: true, 
      data: { mood: newMood, aiResponse },
      message: 'Mood saved successfully' 
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Get user's mood history
app.get('/api/users/:userId/moods', (req, res) => {
  try {
    const { userId } = req.params;
    const { limit, days, startDate, endDate } = req.query;
    
    let userMoods = moodDatabase.moods
      .filter(mood => mood.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Apply date filters
    if (days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
      userMoods = userMoods.filter(mood => new Date(mood.date) >= cutoffDate);
    }
    
    if (startDate) {
      userMoods = userMoods.filter(mood => mood.date >= startDate);
    }
    
    if (endDate) {
      userMoods = userMoods.filter(mood => mood.date <= endDate);
    }
    
    // Apply limit
    if (limit) {
      userMoods = userMoods.slice(0, parseInt(limit));
    }
    
    res.json({ 
      success: true, 
      data: userMoods,
      count: userMoods.length 
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Get analytics data
app.get('/api/users/:userId/analytics', (req, res) => {
  try {
    const { userId } = req.params;
    const userMoods = moodDatabase.moods
      .filter(mood => mood.userId === userId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (userMoods.length === 0) {
      return res.json({ 
        success: true, 
        data: { 
          weeklyAnalysis: null, 
          dailyAverages: [], 
          moodDistribution: [],
          hourlyDistribution: []
        } 
      });
    }
    
    // Calculate daily averages
    const dailyData = {};
    userMoods.forEach(entry => {
      const date = entry.date;
      if (!dailyData[date]) {
        dailyData[date] = { scores: [], moods: [] };
      }
      const moodScore = MOOD_OPTIONS.find(m => m.value === entry.mood)?.score || 0;
      dailyData[date].scores.push(moodScore);
      dailyData[date].moods.push(entry.mood);
    });
    
    const dailyAverages = Object.entries(dailyData)
      .map(([date, data]) => ({
        date,
        average: data.scores.reduce((a, b) => a + b, 0) / data.scores.length,
        count: data.scores.length,
        dominantMood: data.moods.sort((a, b) => 
          data.moods.filter(m => m === a).length - data.moods.filter(m => m === b).length
        ).pop()
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Weekly analysis
    const last7Days = userMoods.filter(entry => {
      const entryDate = new Date(entry.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    });
    
    const last14Days = userMoods.filter(entry => {
      const entryDate = new Date(entry.date);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      return entryDate >= twoWeeksAgo;
    });
    
    const currentWeekAvg = last7Days.length > 0 ? 
      last7Days.reduce((sum, entry) => {
        const moodScore = MOOD_OPTIONS.find(m => m.value === entry.mood)?.score || 0;
        return sum + moodScore;
      }, 0) / last7Days.length : 0;
    
    const previousWeekData = last14Days.slice(last7Days.length);
    const previousWeekAvg = previousWeekData.length > 0 ? 
      previousWeekData.reduce((sum, entry) => {
        const moodScore = MOOD_OPTIONS.find(m => m.value === entry.mood)?.score || 0;
        return sum + moodScore;
      }, 0) / previousWeekData.length : 0;
    
    const moodCounts = {};
    last7Days.forEach(entry => {
      moodCounts[entry.mood] = (moodCounts[entry.mood] || 0) + 1;
    });
    
    const dominantMood = Object.entries(moodCounts)
      .sort(([,a], [,b]) => b - a)[0];
    
    const weeklyAnalysis = {
      currentWeekAvg,
      previousWeekAvg,
      trend: currentWeekAvg > previousWeekAvg ? 'improving' : 
             currentWeekAvg < previousWeekAvg ? 'declining' : 'stable',
      dominantMood: dominantMood ? dominantMood[0] : null,
      totalEntries: last7Days.length,
      moodCounts
    };
    
    // Mood distribution (last 30 days)
    const last30Days = userMoods.filter(entry => {
      const entryDate = new Date(entry.date);
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      return entryDate >= monthAgo;
    });
    
    const distributionCounts = {};
    last30Days.forEach(entry => {
      distributionCounts[entry.mood] = (distributionCounts[entry.mood] || 0) + 1;
    });
    
    const moodDistribution = MOOD_OPTIONS.map(mood => ({
      name: mood.label,
      value: distributionCounts[mood.value] || 0,
      color: mood.color,
      emoji: mood.emoji
    })).filter(item => item.value > 0);
    
    // Hourly distribution
    const hourlyData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      count: 0,
      totalMood: 0,
      avgMood: 0
    }));
    
    userMoods.forEach(entry => {
      const hour = parseInt(entry.time.split(':')[0]);
      const moodScore = MOOD_OPTIONS.find(m => m.value === entry.mood)?.score || 0;
      hourlyData[hour].count++;
      hourlyData[hour].totalMood += moodScore;
    });
    
    const hourlyDistribution = hourlyData.map(item => ({
      ...item,
      avgMood: item.count > 0 ? item.totalMood / item.count : 0,
      timeLabel: `${item.hour.toString().padStart(2, '0')}:00`
    })).filter(item => item.count > 0);
    
    res.json({ 
      success: true, 
      data: {
        weeklyAnalysis,
        dailyAverages,
        moodDistribution,
        hourlyDistribution
      }
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Chat with AI
app.post('/api/chat', (req, res) => {
  try {
    const { userId, message, mood } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID and message are required' 
      });
    }
    
    const aiResponse = getAIResponse(mood, message);
    
    // Store chat session (optional)
    if (!moodDatabase.chatSessions[userId]) {
      moodDatabase.chatSessions[userId] = [];
    }
    
    const chatEntry = {
      id: uuidv4(),
      userId,
      userMessage: message,
      aiResponse,
      mood: mood || null,
      timestamp: new Date().toISOString()
    };
    
    moodDatabase.chatSessions[userId].push(chatEntry);
    
    res.json({ 
      success: true, 
      data: { response: aiResponse },
      message: 'Chat response generated' 
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Get chat history
app.get('/api/users/:userId/chat-history', (req, res) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;
    
    let chatHistory = moodDatabase.chatSessions[userId] || [];
    
    if (limit) {
      chatHistory = chatHistory.slice(-parseInt(limit));
    }
    
    res.json({ 
      success: true, 
      data: chatHistory 
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'MoodBot API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    error: 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'API endpoint not found' 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 MoodBot API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📝 API Documentation: http://localhost:${PORT}/api/mood-options`);
});

module.exports = app;
