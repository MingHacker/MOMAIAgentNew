const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// ✅ 示例接口
app.get('/api/hello', (req, res) => {
  res.json({ message: '👋 Hello from backend!' });
});

// ✅ 提交用户信息接口
app.post('/api/submitUserInfo', (req, res) => {
  const { userId, isPregnant, pregnantMonths, childAge } = req.body;
  console.log('✅ 收到用户提交信息:', req.body);
  res.json({ success: true });
});
const featureRecommendationsByAge = {
  '0-12': [
    { id: 'feeding', title: '喂奶' },
    { id: 'sleep', title: '睡觉' },
    { id: 'outside', title: '晒太阳' },
    { id: 'diaper', title: '换尿布' },
    { id: 'VitaminD', title: '维生素D' },
    { id: 'tummytime', title: '趴睡训练' },
  ],
  '13-24': [
    { id: 'sleep', title: '睡觉' },
    { id: 'outside', title: '晒太阳' },
    { id: 'VitaminD', title: '维生素D' },
    { id: 'reading', title: '读绘本' },
    { id: 'music', title: '听音乐' },
    { id: 'talking', title: '说话训练' },
    { id: 'play', title: '玩耍' },
    { id: 'bath', title: '洗澡' },
  ],
  '25-36': [
    { id: 'reading', title: '绘本' },
    { id: 'talking', title: '语言刺激' },
    { id: 'exercise', title: '运动' },
    { id: 'eating', title: '自己吃饭' },
    { id: 'play', title: '玩耍' },
    { id: 'bath', title: '洗澡' },
  ],
  '37-60': [
    { id: 'reading', title: '阅读' },
    { id: 'math', title: '数数' },
    { id: 'storytelling', title: '讲故事' },
    { id: 'exercise', title: '运动' },
    { id: 'emotion', title: '情绪表达' },
    { id: 'lifeSkills', title: '生活技能' },
  ],
};

app.get('/api/recommendFeatures', (req, res) => {
  const { userId, ageInMonths } = req.query;
  const age = parseInt(ageInMonths); // 前端传月龄

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

// ✅ 保存用户选择功能
const userFeaturesMap = {
  '123': ['feeding', 'diaper', 'sleep', 'outside', 'VitaminD', 'exercise', 'play', 'music', 'talking', 'bath', 'reading'],
  '456': ['outside','VitaminD', 'exercise', 'play', 'music', 'talking', 'bath', 'reading'],
};

app.post('/api/saveUserFeatures', (req, res) => {
  const { userId, featureIds } = req.body;

  console.log('✅ 保存用户功能:', { userId, featureIds });

  // 🔍 打印详细类型
  const isUserIdValid = !!userId;
  const isFeatureIdsArray = Array.isArray(featureIds);
  console.log('🔍 类型检查:', {
    isUserIdValid,
    featureIdsType: typeof featureIds,
    isFeatureIdsArray,
  });

  if (!isUserIdValid || !isFeatureIdsArray) {
    return res.json({ success: false });
  }

  userFeaturesMap[userId] = featureIds;
  console.log('✅ 保存成功 ✅');
  res.json({ success: true });
});

// ✅ 获取用户选择的功能（Dashboard 用）
app.get('/api/getUserFeatures', (req, res) => {
  const { userId } = req.query;
  const selectedFeatureIds = userFeaturesMap[userId] || [];
  res.json({ selectedFeatureIds }); // ✅ 返回标准结构
});
app.post('/api/record/feed', (req, res) => {
  console.log('🍼 收到喂奶记录:', req.body);
  res.json({ success: true });
});

app.post('/api/record/sleep', (req, res) => {
  console.log('😴 收到睡觉记录:', req.body);
  res.json({ success: true });
});

app.post('/api/record/diaper', (req, res) => {
  console.log('💩 收到尿布记录:', req.body);
  res.json({ success: true });
});

app.post('/api/record/outside', (req, res) => {
  console.log('🚶‍♀️ 收到外出记录:', req.body);
  res.json({ success: true });
});
app.listen(3000, '0.0.0.0', () => {
  console.log('✅ Server running at http://10.0.0.23:3000');
});
