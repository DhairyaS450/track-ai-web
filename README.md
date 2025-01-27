 # TaskTide AI

TaskTide AI is an AI-powered scheduling and productivity app tailored for high-school and university students. It integrates advanced features like Google Calendar sync, AI-driven study session planning, and a chatbot assistant to optimize time management and reduce stress.

---

## Features

### Core Functionalities
- **Dashboard**: 
  - Displays tasks, events, deadlines, and study sessions in a prioritized and user-friendly layout.
  - Provides insights and actionable items at a glance.

- **Calendar**:
  - Full integration with Google Calendar for syncing tasks and events.
  - Visualize all scheduled activities in one place.

- **Study Sessions**:
  - AI-planned study sessions using techniques like the Pomodoro method.
  - Includes features like mini-quizzes and adaptive breaks.
  - A dedicated view for ongoing, completed, and upcoming sessions.

- **Analytics**:
  - Visualize productivity trends and time usage.
  - Track progress in completing tasks, events, and study sessions.

- **Chatbot**:
  - Quickly create tasks, events, and study sessions via a conversational interface.
  - Provides assistance during study sessions and resolves scheduling conflicts.

- **Settings**:
  - Configure syncing preferences, notification settings, and app themes.

---

## Installation

### Prerequisites
- **Node.js** (v16 or later)
- **React** (v18 or later)
- **Vite**
- **Next.js** (v13 or later)
- **Firebase Project** with the following services enabled:
  - Authentication
  - Firestore Database
  - Cloud Functions

### Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/DhairyaS450/track-ai-web.git
   cd track-ai-web
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up Firebase:
   - Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
   - Enable required Firebase services.
   - Download the `firebase-service-account.json` file for server-side usage.
   - Add Firebase configuration to your environment variables.

4. Start the server:
   ```bash
   npm run start
   ```

---

## Usage

### Initial Setup
1. Connect your Google account to sync tasks and events.
2. Configure app settings, including notification preferences and study session parameters.

### Key Workflows
- **Create Tasks/Events**:
  - Use the chatbot or manual entry to add tasks/events.
  - Sync them with Google Calendar.

- **Plan Study Sessions**:
  - Define goals, duration, and techniques like Pomodoro.
  - Let AI suggest optimal study times.

- **View Analytics**:
  - Access progress reports and productivity insights.

---

## Folder Structure
```
tasktide-ai/
|-- client/                  # Frontend of the application
|   |-- public/              # Public static assets (images, icons, etc.)
|   |-- src/                 # Main source code directory
|   |   |-- api/             # API calls (Firebase, Google API, etc.)
|   |   |-- components/      # Reusable React components (UI elements, widgets)
|   |   |-- config/          # Configuration files (Firebase setup, environment variables)
|   |   |-- contexts/        # React Contexts for global state management
|   |   |-- hooks/           # Custom React hooks for reusable logic
|   |   |-- lib/             # Server-side logic and utilities (e.g., database interactions, AI integrations)
|   |   |-- pages/           # Next.js pages for routing
|   |   |-- styles/          # Global CSS and TailwindCSS configuration
|   |   |-- types/           # TypeScript types and interfaces
|   |   |-- utils/           # Utility functions for general purposes
|   |   |-- App.tsx          # Main App component
|   |   |-- index.tsx        # React entry point
|   |   |-- main.tsx         # Main rendering entry point
|   |-- index.html           # HTML template for the app
|   |-- tailwind.config.js   # TailwindCSS configuration
|   |-- postcss.config.js    # PostCSS configuration
|   |-- vite.config.ts       # Vite configuration
|-- api/                     # Vercel serverless API routes
|   |-- [route]/             # Individual serverless functions (e.g., CRUD operations, integrations)
|-- lib/                     # Server-side logic moved from Express (now used in serverless functions)
|   |-- config/              # Configuration for Firebase and third-party APIs
|   |-- controllers/         # Logic for API endpoints
|   |-- models/              # Database models (Tasks, Events, StudySessions, etc.)
|   |-- services/            # Business logic (AI integrations, scheduling algorithms)
|   |-- utils/               # Utility functions for server-side operations
|-- .gitignore               # Files and directories to be ignored by Git
|-- vercel.json              # Vercel deployment configuration
|-- README.md                # Project documentation
|-- LICENSE                  # Licensing information
```

---

## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a new branch for your feature/bug fix.
3. Submit a pull request with a detailed description of changes.

---

## License
This project is licensed under the MIT License. See the LICENSE file for details.
