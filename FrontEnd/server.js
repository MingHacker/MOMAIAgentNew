const express = require('express');
const cors = require('cors');
const app = express();
const port = 8000;

app.use(cors());
app.use(express.json());

// ✅ Example endpoint
app.get('/api/hello', (req, res) => {
  res.json({ message: '👋 Hello from backend!' });
});

// ✅ Submit user info endpoint
app.post('/api/submitUserInfo', (req, res) => {
  const { userId, isPregnant, pregnantMonths, childAge } = req.body;
  console.log('✅ Received user info:', req.body);
  res.json({ success: true });
});
const featureRecommendationsByAge = {
  '0-12': [
    { id: 'feeding', title: 'Feeding' },
    { id: 'sleep', title: 'Sleep' },
    { id: 'outside', title: 'Sunlight' },
    { id: 'diaper', title: 'Diaper Change' },
    { id: 'VitaminD', title: 'Vitamin D' },
    { id: 'tummytime', title: 'Tummy Time' },
  ],
  '13-24': [
    { id: 'sleep', title: 'Sleep' },
    { id: 'outside', title: 'Sunlight' },
    { id: 'VitaminD', title: 'Vitamin D' },
    { id: 'reading', title: 'Reading' },
    { id: 'music', title: 'Music' },
    { id: 'talking', title: 'Speech Practice' },
    { id: 'play', title: 'Play' },
    { id: 'bath', title: 'Bath' },
  ],
  '25-36': [
    { id: 'reading', title: 'Reading' },
    { id: 'talking', title: 'Language Stimulation' },
    { id: 'exercise', title: 'Exercise' },
    { id: 'eating', title: 'Self Feeding' },
    { id: 'play', title: 'Play' },
    { id: 'bath', title: 'Bath' },
  ],
  '37-60': [
    { id: 'reading', title: 'Reading' },
    { id: 'math', title: 'Math' },
    { id: 'storytelling', title: 'Storytelling' },
    { id: 'exercise', title: 'Exercise' },
    { id: 'emotion', title: 'Emotion Expression' },
    { id: 'lifeSkills', title: 'Life Skills' },
  ],
};

app.get('/api/recommendFeatures', (req, res) => {
  const { userId, ageInMonths } = req.query;
  const age = parseInt(ageInMonths); // Frontend passes age in months

  let features = [];

  if (age <= 12) {
    features = featureRecommendationsByAge['0-12'];
  } else if (age <= 24) {
    features = featureRecommendationsByAge['13-24'];
  } else if (age <= 36) {
    features = featureRecommendationsByAge['25-36'];
  } else {
    features = featureRecommendationsByAge['37-60'];
  }

  res.json({ features });
});

// ✅ Save user selected features
const userFeaturesMap = {
  '123': ['feeding', 'diaper', 'sleep', 'outside', 'VitaminD', 'exercise', 'play', 'music', 'talking', 'bath', 'reading'],
  '456': ['outside','VitaminD', 'exercise', 'play', 'music', 'talking', 'bath', 'reading'],
};

app.post('/api/saveUserFeatures', (req, res) => {
  const { userId, featureIds } = req.body;

  console.log('✅ Saving user features:', { userId, featureIds });

  // 🔍 Print detailed types
  const isUserIdValid = !!userId;
  const isFeatureIdsArray = Array.isArray(featureIds);
  console.log('🔍 Type check:', {
    isUserIdValid,
    featureIdsType: typeof featureIds,
    isFeatureIdsArray,
  });

  if (!isUserIdValid || !isFeatureIdsArray) {
    return res.json({ success: false });
  }

  userFeaturesMap[userId] = featureIds;
  console.log('✅ Save successful ✅');
  res.json({ success: true });
});

// ✅ 获取用户选择的功能（Dashboard 用）
app.get('/api/getUserFeatures', (req, res) => {
  const { userId } = req.query;
  const selectedFeatureIds = userFeaturesMap[userId] || [];
  res.json({ selectedFeatureIds }); // ✅ Return standard structure
});
app.post('/api/record/feed', (req, res) => {
  console.log('🍼 Received feeding record:', req.body);
  res.json({ success: true });
});

app.post('/api/record/sleep', (req, res) => {
  console.log('😴 Received sleep record:', req.body);
  res.json({ success: true });
});

app.post('/api/record/diaper', (req, res) => {
  console.log('💩 Received diaper record:', req.body);
  res.json({ success: true });
});

app.post('/api/record/outside', (req, res) => {
  console.log('🚶‍♀️ Received outdoor record:', req.body);
  res.json({ success: true });
});
app.listen(8000, '0.0.0.0', () => {
  console.log('✅ Server running at http://10.0.0.23:8000');
});
