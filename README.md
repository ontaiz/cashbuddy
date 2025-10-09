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

### Backend
- **[Supabase](https://supabase.com/)** - Open-source Backend-as-a-Service
  - PostgreSQL database
  - Built-in user authentication
  - Multi-language SDK support
  - Self-hosting capabilities

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

The application will be available at `http://localhost:4321` (default Astro port).

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

