# MedLens Frontend

The modern, medical-grade frontend interface for the MedLens system. Built with React and Vite, this application provides a secure and responsive dashboard for healthcare professionals to manage patient identities, view encrypted medical records, and perform real-time biometric identification.

## Features

### Authentication & Security

- **Role-Based Access Control (RBAC)**: Distinct, secure environments for Administrators, Doctors, and Nurses.
- **Biometric Login**: Support for face-recognition based login (in development).
- **Secure Session Management**: JWT handling with automatic token refreshing via `AuthContext`.
- **Protected Routes**: Middleware-like route guards ensuring unauthorized access is blocked.

### Medical & Biometric Core

- **Real-Time Face Recognition**:
  - **Live Camera Feed**: Powered by `FaceCapture.jsx` and `useCamera` hook.
  - **Multi-Face Detection**: Capability to detect multiple patients in a single frame (`MultiFaceCapture.jsx`).
  - **Image Upload**: Fallback mechanism for static image analysis (`FaceUploader.jsx`).
- **Patient Management**:
  - **Profile Dashboard**: Comprehensive view of patient vitals, history, and emergency contacts.
  - **Connection Graph**: Manage Doctor-Patient relationships and authorized family members (`Connections.jsx`).
- **Data Privacy**: UI designed to obscure sensitive data until authorized.

### User Experience (UX)

- **Glassmorphism Design**: Modern, clean aesthetic optimized for clinical environments (`glassmorphism.css`).
- **Responsive Layouts**: Adapts seamlessly to tablets (rounds) and desktops (nurses' station).
- **Instant Feedback**: Toast notifications for all system actions (success, error, network status).
- **Interactive Demos**: Built-in `DemoPage` for training and simulation without backend dependency.

## Technology Stack

- **Core**: [React 18](https://reactjs.org/)
- **Build System**: [Vite](https://vitejs.dev/) (Fast HMR & Optimized Builds)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Custom Glassmorphism
- **Routing**: [React Router v6](https://reactrouter.com/)
- **State Management**: React Context API (`AuthContext`)
- **API Client**: [Axios](https://axios-http.com/) (Interceptors for auth headers)
- **Backend Integration**:
  - REST API (FastAPI)
  - [Supabase](https://supabase.com/) (Direct subscription/storage access)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Validation**: [Zod](https://zod.dev/)

## Project Structure

A highly organized codebase ensuring scalability and maintainability.

```bash
frontend/
├── src/
│   ├── components/         # UI Building Blocks
│   │   ├── FaceCapture.jsx     # Webcam handling & frame capture
│   │   ├── FaceUploader.jsx    # Drag-and-drop image upload
│   │   ├── Navbar.jsx          # Responsive navigation
│   │   ├── MedicalInfo.jsx     # Patient medical history display
│   │   └── ... (Modals, Cards, Spinners)
│   ├── context/            # Global State
│   │   └── AuthContext.js      # User session & permission state
│   ├── hooks/              # Custom Logic (Separation of Concerns)
│   │   ├── useCamera.js        # Camera stream management
│   │   ├── useAuth.js          # Authentication actions
│   │   ├── useConnections.js   # Patient relationship logic
│   │   └── ...
│   ├── pages/              # Route Views
│   │   ├── AdminDashboard.jsx  # System administration
│   │   ├── ProfileDashboard.jsx # Patient details view
│   │   ├── RecognitionPage.jsx # Core biometric scanning
│   │   └── ...
│   ├── services/           # API Integration
│   │   ├── api.js              # General backend endpoints
│   │   ├── auth.js             # Auth-specific endpoints
│   │   └── supabase.js         # Direct Supabase client
│   └── utils/              # Helpers
│       ├── validation.js       # Input validation logic
│       └── dateUtils.js        # Formatting helpers
├── public/                 # Static Assets
└── .env                    # Environment Configuration
```

## Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **npm** or **yarn**

### Installation

1.  **Navigate to the frontend directory:**

    ```bash
    cd frontend
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Environment Configuration:**
    Create a `.env` file in the `frontend/` root directory. This is critical for API connection.

    ```env
    # Backend API URL (FastAPI)
    VITE_API_URL=http://localhost:8000

    # Supabase Configuration (For Auth/Storage)
    VITE_SUPABASE_URL=your_project_url
    VITE_SUPABASE_ANON_KEY=your_anon_key
    ```

4.  **Run Development Server:**
    ```bash
    npm run dev
    ```
    The application will launch at `http://localhost:5173`.

## Available Scripts

See `package.json` for the full list.

| Script               | Description                                            |
| :------------------- | :----------------------------------------------------- |
| `npm run dev`        | Starts the Vite development server.                    |
| `npm run build`      | Compiles the app for production.                       |
| `npm run preview`    | Locally previews the production build.                 |
| `npm run lint`       | Runs ESLint to identify code quality issues.           |
| `npm run lint:fix`   | Automatically fixes simple linting errors.             |
| `npm run format`     | Formats code using Prettier.                           |
| `npm run type-check` | Runs TypeScript compiler (check-only) for type safety. |

## Key Modules Explained

### Face Recognition Flow

1. **Capture**: `FaceCapture` component uses `useCamera` to access the webcam.
2. **Process**: Frames are captured and sent via `api.js` to the backend `/recognize` endpoint.
3. **Result**: Backend returns a `match` object (or null).
4. **Display**: If matched, `RecognitionPage` redirects to the `ProfileDashboard` of the identified patient.

### Authentication System

- Uses **JWT (JSON Web Tokens)**.
- `AuthContext` holds the `user` state and `token`.
- `axios.js` is configured with an **interceptor** to automatically attach the `Authorization: Bearer <token>` header to every request.
- Handles automatic logout on 401 (Unauthorized) responses.

---

© 2026 MedLens Inc. All rights reserved.
