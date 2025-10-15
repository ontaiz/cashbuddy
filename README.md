# CashBuddy

A responsive web application designed for easy and quick tracking of daily expenses in Polish złoty (PLN). CashBuddy focuses on intuitive interface and clear statistics to help users better manage their household budget.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

CashBuddy addresses a common problem: users losing control over their daily expenses. Without a clear tracking tool, people struggle with:

- Low financial awareness
- Unconscious budget overruns
- Difficulties in optimizing future spending
- Chaos in storing receipts and documents

### Key Features

**Authentication & Account Management**
- Email and password registration
- Secure login/logout functionality
- User panel with password change and account deletion options

**Expense Management (CRUD)**
- Add expenses with amount (PLN), date, description, and name
- Edit and delete existing expenses
- Expense list with sorting and filtering by date and amount

**Dashboard & Statistics**
- Total sum of all expenses
- Current month expenses summary
- Line chart visualizing monthly spending trends
- Top 5 biggest expenses list

**Security & Privacy**
- GDPR-compliant data storage
- Data isolation - users only see their own expenses
- Secure authentication and session management

## Tech Stack

### Frontend
- **[Astro 5](https://astro.build/)** - Fast, modern web framework with minimal JavaScript
- **[React 19](https://react.dev/)** - Interactive components where interactivity is needed
- **[TypeScript 5](https://www.typescriptlang.org/)** - Static typing for better code quality and IDE support
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework for rapid UI development
- **[Shadcn/ui](https://ui.shadcn.com/)** - Accessible React component library
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Minimal state management for authentication

### Backend
- **[Supabase](https://supabase.com/)** - Open-source Backend-as-a-Service
  - PostgreSQL database
  - Built-in user authentication with `@supabase/ssr`
  - Multi-language SDK support
  - Self-hosting capabilities

### Testing
- **[Vitest](https://vitest.dev/)** - Modern, fast test runner compatible with Vite
- **[@vitest/ui](https://vitest.dev/guide/ui.html)** - Browser-based UI for test visualization and debugging
- **[React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)** - Testing React components with user-focused approach
- **[@testing-library/user-event](https://testing-library.com/docs/user-event/intro)** - Advanced user interaction simulation
- **[Playwright](https://playwright.dev/)** - Modern End-to-End testing framework
- **[Mock Service Worker (MSW)](https://mswjs.io/)** - API mocking at the network level for integration tests
- **[@faker-js/faker](https://fakerjs.dev/)** - Realistic test data generation

### CI/CD & Hosting
- **GitHub Actions** - Continuous Integration and Deployment pipelines
- **DigitalOcean** - Application hosting via Docker images

## Getting Started Locally

### Prerequisites

- Node.js version `22.14.0` (use [nvm](https://github.com/nvm-sh/nvm) for easy version management)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ontaiz/cashbuddy.git
cd cashbuddy
```

2. Use the correct Node.js version:
```bash
nvm use
```

3. Install dependencies:
```bash
npm install
```

4. Set up environment variables:
```bash
cp .env.example .env
```
Then edit `.env` file with your Supabase credentials and other required configuration.

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Authentication Architecture

CashBuddy implements server-side authentication using Supabase Auth with the following architecture:

### Key Components

1. **Server-Side Session Management**
   - Uses `@supabase/ssr` for proper SSR cookie handling
   - Middleware validates sessions on every request
   - Automatic redirects for protected routes

2. **Authentication Flow**
   - Login/Register pages → API endpoints (`/api/auth/login`, `/api/auth/logout`)
   - Session stored in HTTP-only cookies for security
   - User data passed from Astro to React components via props

3. **Route Protection**
   - **Public routes**: `/login`, `/register`, `/password-reset`, `/update-password`
   - **Protected routes**: `/dashboard`, `/expenses`, and all API endpoints
   - Logged-in users accessing auth pages are redirected to `/dashboard`
   - Non-authenticated users accessing protected routes are redirected to `/login`

4. **Client-Side State**
   - Zustand store manages auth state in React components
   - Initial user data hydrated from Astro server
   - AuthStatus component displays user info and logout functionality

### Password Reset Flow
1. **Request Reset** - User enters email at `/password-reset`
2. **Email Sent** - Supabase sends email with reset link containing auth token
3. **Local Testing** - Check emails at `http://localhost:54324` (Inbucket)
4. **Token Processing** - Browser client processes token from URL fragment
5. **Update Password** - User sets new password at `/update-password`

### Security Features
- HTTP-only, secure cookies with SameSite protection
- CSRF protection via cookie-based sessions
- User data isolation - each user sees only their own expenses
- Proper session validation on both server and API routes
- Password reset tokens with expiration

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Build the application for production |
| `npm run preview` | Preview the production build locally |
| `npm run astro` | Run Astro CLI commands |
| `npm run lint` | Run ESLint to check for code quality issues |
| `npm run lint:fix` | Run ESLint and automatically fix fixable issues |
| `npm run format` | Format code using Prettier |
| `npm run test` | Run unit and integration tests with Vitest |
| `npm run test:ui` | Run tests with Vitest UI for visual debugging |
| `npm run test:coverage` | Run tests with coverage reporting |
| `npm run test:e2e` | Run End-to-End tests with Playwright |

## Project Scope

### Included Features
✅ User authentication (email + password)  
✅ Expense CRUD operations  
✅ Dashboard with statistics and visualizations  
✅ Monthly expense tracking  
✅ Top expenses analysis  
✅ Responsive design (desktop + mobile browser)  
✅ Data privacy and GDPR compliance  

## Project Status

This project is in active development. The core features are being implemented according to the product requirements document.

## License

This project is licensed under the MIT License.

---

**CashBuddy** - Take control of your daily expenses 💰

