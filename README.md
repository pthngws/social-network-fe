# Social Network Frontend

A modern social network application built with React, Vite, and Tailwind CSS.

## Features

- User authentication and registration
- Real-time messaging with WebSocket
- Post creation and interaction
- Story sharing
- Friend management
- Responsive design

## Tech Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS
- **State Management**: React Context API
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **WebSocket**: SockJS + STOMP
- **UI Components**: Headless UI, Heroicons
- **Build Tool**: Vite with Terser minification

## Getting Started

### Prerequisites

- Node.js 18.20.4+ (see `.nvmrc`)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd socialnetwork-fe

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

## Deployment

### Vercel

This project is configured for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect the Vite framework
3. The build will use the configuration in `vercel.json`

### Manual Deployment

```bash
# Build the application
npm run build

# The built files will be in the `dist` directory
# Deploy the `dist` directory to your hosting provider
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── layouts/            # Layout components
├── pages/              # Page components
├── routes/             # Route configuration
├── services/           # API services
└── utils/              # Utility functions
```

## Environment Variables

Create a `.env` file in the root directory:

```env
# Backend API Configuration
VITE_API_BASE_URL=https://wsproject-5eb9.onrender.com/

# For local development, you can override with:
# VITE_API_BASE_URL=http://localhost:8080/
```

**Note**: Environment variables must start with `VITE_` to be accessible in the browser.

**Current Backend**: The application is configured to use `https://wsproject-5eb9.onrender.com/` as the default backend URL.

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Troubleshooting

### Build Issues

If you encounter build issues:

1. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. Update dependencies:
   ```bash
   npm update
   ```

3. Check for vulnerabilities:
   ```bash
   npm audit fix
   ```

### Vercel Deployment Issues

- Ensure all dependencies are in `package.json`
- Check that build command is `npm run build`
- Verify output directory is `dist`
- Check Node.js version compatibility
- If you get "Function Runtimes must have a valid version" error:
  - Remove unnecessary `functions` configuration from `vercel.json`
  - For React apps, only keep `rewrites` configuration
- If build fails with "terser not found":
  - Run `npm install --save-dev terser`
- If you get module externalization warnings:
  - These are usually safe to ignore for browser-only modules
