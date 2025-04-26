# MOM AI Agent

> _Motherhood isn't a job — but it still deserves support._

I'm an automation engineer and a mom of two. After having my second child while working full-time, I found myself overwhelmed — feedings, diapers, doctor appointments, emotional pressure — the invisible load of motherhood was untracked and unsupported.\
**Mom AI Agent** was born from this real-world need: not another baby tracker, but a true AI-powered support system for moms.

---

## 🚨 The Problem

- Every new mom juggles an avalanche of tasks: feedings, diapers, naps, doctor visits, emotional highs and lows.
- 1 in 7 mothers experiences postpartum depression.
- 60% of new families have both parents working.
- Existing tools mainly track the baby — few support **mothers’ mental and physical health**.
- **Motherhood is the most important — and most underestimated — role.**\
  Today, there’s no unified, intelligent system to relieve the invisible overload moms carry daily.

---

## 💡 The Solution: MOM AI Agent

**MOM AI Agent** is an intelligent companion app, designed to act as a support team in your pocket. Powered by six specialized AI agents, it helps moms:

- 🍼 **Track** feedings, diapers, sleep cycles, and automatically monitor baby’s crying minutes
- 📈 **Sync with HealthKit** to track HRV and stress levels for both MOM & BABY
- 💬 **Receive emotional nudges** and mental health check-ins
- 📋 **Manage daily tasks** through a smart Task Manager Agent
- 🧠 **Get instant parenting and policy answers** via Q&A agent
- 🎙️ **Real-time AI chatbot** support with text and voice-based interaction

**Our vision**:\
A future where no mom feels alone or overwhelmed, where technology anticipates her needs and offers real support — intelligently, gently, and holistically.

---

## 🎯 Market Opportunity

- \$46B+ in annual millennial parenting spending.
- Existing apps target either **baby tracking** or **fitness** — very few address **motherhood + emotional wellbeing + AI**.
- Moms today are **tech-savvy**, **data-aware**, and **deeply underserved**.

> **AI is ready. Moms are not okay.**\
> **The moment is now — and we must move fast.**

---

## 🧐 Key Features

- **Baby Manager Agent**: Feedings, diaper logs, sleep tracking, cry detection.
- **Mom Health Agent**: HRV, stress levels, breathing rate, sleep tracking.
- **Emotional Companion Agent**: Mood tracking, stress analysis, gentle emotional messaging.
- **Task Manager Agent**: Parenting and home task generation, reminders, and prioritization.
- **Chat Agent**: Real-time Q&A based on baby and mom health data.
- **Voice Interaction**: Future voice-based emotional support.

---

## 🏗️ Product Status

- 🎨 Figma prototype: ✅ Completed
- 🛠️ Core AI agents: 🏗️ Building (Baby Manager, Health Monitor, Q&A, Emotion Tracker)
- 📋 Microsoft Hackathon Entry: ✅ April 2025
- 📱 iOS MVP Launch: Planned for May 2025

---

## 📦 Tech Stack

| Layer        | Technology                       |
| ------------ | -------------------------------- |
| Frontend     | React Native (Expo)              |
| Backend      | FastAPI (Python)                 |
| Database     | Supabase (PostgreSQL)            |
| AI Framework | LangGraph / LangChain agents     |
| AI Models    | DeepSeek, GPT-4                  |
| Device Sync  | Apple HealthKit (future roadmap) |

---

## 📂 Folder Structure

```
MOM AI Agent/
├── Backend/                  # Python FastAPI backend
│   ├── agents/               # AI agent implementations
│   │   ├── babymanager/      # Baby manager agent components
│   │   ├── emotionmanager/   # Emotion tracking agent components
│   │   ├── mommanager/       # Mom health agent components
│   │   └── taskmanager/      # Task management agent components
│   ├── api/                  # API endpoints
│   ├── core/                 # Core functionality (auth, database)
│   └── utils/                # Utility functions
├── FrontEnd/                 # React Native frontend
│   ├── assets/               # Images and static assets
│   ├── components/           # Reusable UI components
│   ├── screens/              # Application screens
│   ├── services/             # API services and hooks
│   ├── src/                  # Core functionality
│   ├── styles/               # Styling
│   └── utils/                # Utility functions
└── supabase/                 # Supabase database migrations
    └── migrations/           # SQL migration files
```

## ⚙️ Setup & Installation

### Prerequisites

- Node.js 16+ and npm
- Python 3.8+
- Supabase account and project
- OpenAI API key

### Backend Setup

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd MOM-AI-Agent
   ```

2. **Install Python dependencies:**

   ```bash
   cd Backend
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   Create a `.env` file in the Backend directory with:

   ```
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Run the backend server:**
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Install JavaScript dependencies:**

   ```bash
   cd FrontEnd
   npm install
   ```

2. **Configure environment variables:**
   Create a `.env` file in the FrontEnd directory with:

   ```
   EXPO_PUBLIC_API_URL=http://localhost:8000
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Run the frontend application:**
   ```bash
   npx expo start
   ```

## 📊 AI Agent Architecture

The MOM AI Agent system uses a multi-agent architecture powered by LangGraph and LangChain. Each agent is responsible for a specific domain and works together to provide a comprehensive support system for mothers.

### Agent Components

1. **Baby Manager Agent**

   - Tracks baby activities (feeding, diaper, sleep, crying)
   - Analyzes patterns and generates reminders
   - Provides insights on baby's development

2. **Mom Health Agent**

   - Monitors mom's health metrics (HRV, sleep, steps, etc.)
   - Analyzes physical and emotional recovery status
   - Provides personalized health recommendations

3. **Emotion Companion Agent**

   - Tracks mood and stress levels
   - Provides emotional support and encouragement
   - Generates empathetic responses based on health data

4. **Task Manager Agent**
   - Creates and prioritizes parenting and home tasks
   - Sends reminders for important activities
   - Helps manage the daily workload

### Agent Implementation

Each agent follows a similar structure:

- **Graph**: Defines the workflow and connections between steps
- **Schema**: Defines the data structure and state management
- **Steps**: Implements the individual processing steps
- **Prompts**: Contains the LLM prompts for AI interactions

The agents use LangGraph for orchestration, allowing for complex workflows with conditional logic and state management. They interact with the Supabase database to store and retrieve data, and use OpenAI's GPT models for natural language processing and generation.

## 🔥 Innovation Highlights

- Multi-agent orchestration (baby + mom + tasks + emotions)
- Emotional companion for moms — not just task tracking
- Human-in-the-loop design: moms can edit tasks and emotional reports
- Health + emotional intelligence + productivity in one AI-native app

---

## 🤖 Responsible AI Principles

- Human-centered design
- Full transparency on data tracking (opt-in HealthKit sync)
- Emotional support avoids diagnosis and maintains privacy
- Clear boundaries between advisory and decision-making

---

## 🛃️ Future Improvements

- Baby cry sound detection (using Apple Watch/phone mic)
- Toddler growth activity tracking
- Group emotional summaries across parenting communities

---

## 🧑‍💻 Contributors

- Built with ❤️ by Cathleen Lin & Ming Ma
- Contact: [[cathleenlin0330@gmail.com](mailto:cathleenlin0330@gmail.com)]

---

## 📜 License

This project is licensed under the MIT License.

---

# ✨ MOM AI Agent: Building Relief, Not Just Tools.

---
