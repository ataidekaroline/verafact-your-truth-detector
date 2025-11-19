# VeraFact

![VeraFact Logo](src/assets/verafact-logo.png)

**VeraFact** is a deep learning-powered fake news detection platform that helps users verify the authenticity of news articles and claims using advanced AI models. Built as a Progressive Web App (PWA), VeraFact combines machine learning with real-time fact-checking to provide instant verification results with confidence scores and supporting references.

## 📸 Screenshots

### Home Page - Verification & Trending News
The homepage features a clean interface for verifying news articles with instant AI-powered analysis. Users can paste news URLs or text to verify authenticity. Below the verification input, trending verified news is organized by category (Politics, Tech, Science, Health) with confidence scores displayed for each article.

![Home Page](https://lovable.dev/projects/250a6770-45a0-40a0-8fdd-1d6334c08a9e/sandbox/screenshot?path=%2F)

### Real-Time Radar - Live Verified News Feed
The Radar page displays a continuously updated feed of verified news from trusted sources like CNN Brasil. Each article shows its category, confidence score, publication time, and links directly to the source. The feed updates automatically via real-time subscriptions.

![Radar Feed](https://lovable.dev/projects/250a6770-45a0-40a0-8fdd-1d6334c08a9e/sandbox/screenshot?path=%2Fradar)

## 🌟 Features

### 🔍 News Verification
- **AI-Powered Analysis**: Verify news articles and claims using advanced machine learning models
- **Confidence Scoring**: Get detailed confidence scores (0-100%) for each verification
- **Supporting Evidence**: Receive reasoning, fact summaries, and reference links for each verification
- **Instant Results**: Fast verification with real-time processing

![Verification Feature](https://lovable.dev/projects/250a6770-45a0-40a0-8fdd-1d6334c08a9e/sandbox/screenshot?path=%2F)

### 📡 Real-Time Radar
- **Live Verified News Feed**: Automatically updated feed of verified news from trusted sources
- **Category-Based Organization**: Browse news by Politics, Technology, Health, Economy, and more
- **Real-Time Updates**: News feed updates automatically via WebSocket subscriptions
- **Manual Refresh**: Trigger on-demand news fetching from CNN Brasil RSS feeds

![Real-Time Radar](https://lovable.dev/projects/250a6770-45a0-40a0-8fdd-1d6334c08a9e/sandbox/screenshot?path=%2Fradar)

### 🏠 Home Dashboard
- **Trending Verified News**: Explore the latest verified articles by category
- **Category Filters**: Filter news by specific categories or view all at once
- **Recent Verifications**: See examples of recently verified news articles
- **Quick Verification Input**: Submit news for verification directly from the homepage

![Category Filtering](https://lovable.dev/projects/250a6770-45a0-40a0-8fdd-1d6334c08a9e/sandbox/screenshot?path=%2F)

### 👤 User Features
- **Authentication**: Secure email-based authentication system
- **Verification History**: Track all your past verifications (Coming soon)
- **Personalized Profile**: View your verification statistics and activity (Coming soon)
- **Notifications**: Stay updated with important alerts (Coming soon)

## 🏗️ Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui
- **State Management**: React Query (TanStack Query)
- **Routing**: React Router v6

### Backend (Lovable Cloud)
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime subscriptions
- **Edge Functions**: Serverless functions for background processing
- **AI Integration**: Lovable AI for fact-checking

### Database Schema

#### Tables
- **verified_news**: Stores verified news articles with confidence scores
- **categories**: News categories (Politics, Tech, Health, Economy, etc.)
- **verification_history**: User verification history and results

#### Security
- Row Level Security (RLS) policies on all tables
- Public read access for verified news and categories
- User-scoped access for verification history

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository**
```bash
git clone <YOUR_GIT_URL>
cd verafact
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
The project uses Lovable Cloud, so environment variables are automatically configured. The `.env` file is auto-generated and includes:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

4. **Start development server**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📁 Project Structure

```
verafact/
├── src/
│   ├── assets/              # Images and static assets
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── Header.tsx      # App header with navigation
│   │   ├── BottomNav.tsx   # Mobile bottom navigation
│   │   ├── NewsCard.tsx    # News article card component
│   │   └── VerificationResult.tsx  # Verification result display
│   ├── hooks/              # Custom React hooks
│   ├── integrations/       # Third-party integrations
│   │   └── supabase/       # Supabase client and types
│   ├── lib/                # Utility functions
│   ├── pages/              # Page components
│   │   ├── Home.tsx        # Homepage with verification input
│   │   ├── Radar.tsx       # Real-time verified news feed
│   │   ├── Auth.tsx        # Authentication page
│   │   ├── Profile.tsx     # User profile page
│   │   └── Notifications.tsx  # Notifications page
│   ├── App.tsx             # Main app component
│   ├── index.css           # Global styles and design tokens
│   └── main.tsx            # App entry point
├── supabase/
│   ├── functions/          # Edge Functions
│   │   ├── verify-news/    # AI news verification function
│   │   └── fetch-cnn-news/ # CNN Brasil RSS feed fetcher
│   └── config.toml         # Supabase configuration
├── public/                 # Static public assets
└── package.json           # Dependencies and scripts
```

## 🎨 Design System

VeraFact uses a modern dark-mode aesthetic with a carefully crafted color system:

### Color Palette
- **Primary**: Vibrant pink/orange (`hsl(340, 82%, 52%)`)
- **Background**: Dark gradient (`hsl(240, 10%, 4%)` to `hsl(240, 10%, 8%)`)
- **Foreground**: Light text on dark backgrounds
- **Accent**: Pink accents for interactive elements

### Design Tokens
All colors are defined as CSS custom properties in `src/index.css` and configured in `tailwind.config.ts` for consistent theming across the application.

## 🔧 Edge Functions

### verify-news
**Purpose**: Verifies news articles using Lovable AI
- **Input**: News text or URL
- **Output**: Verification result with confidence score, reasoning, summary, and references
- **Model**: Uses advanced AI models for fact-checking

### fetch-cnn-news
**Purpose**: Fetches and verifies news from CNN Brasil RSS feed
- **Process**: 
  1. Fetches latest news from CNN Brasil RSS
  2. Verifies each article through verify-news function
  3. Stores verified articles in database
  4. Maps articles to appropriate categories
- **Trigger**: Called manually via Radar refresh button
- **Frequency**: Can be scheduled for automatic updates

## 📊 Key Technologies

| Technology | Purpose |
|-----------|---------|
| React 18 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool and dev server |
| Tailwind CSS | Styling framework |
| Radix UI | Accessible component primitives |
| React Query | Server state management |
| React Router | Client-side routing |
| Supabase | Backend and database |
| Lovable AI | AI-powered verification |
| date-fns | Date formatting |
| Lucide React | Icon library |

## 🔐 Authentication

VeraFact uses Supabase Auth for secure authentication:
- Email/password authentication
- Auto-confirm email signups (enabled)
- Persistent sessions with localStorage
- Protected routes for authenticated users

## 🌐 Deployment

### Lovable Platform
The easiest way to deploy is through Lovable:
1. Click **Publish** in the top-right corner
2. Click **Update** to deploy frontend changes
3. Backend changes (edge functions, migrations) deploy automatically

### Custom Domain
Connect your custom domain in Project Settings → Domains (requires paid plan)

### Self-Hosting
See [Lovable Self-Hosting Guide](https://docs.lovable.dev/tips-tricks/self-hosting) for manual deployment instructions.

## 🧪 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Code Style
- Use TypeScript for type safety
- Follow React best practices and hooks patterns
- Use semantic HTML elements
- Implement responsive design
- Follow the established design system

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is part of the Lovable platform. See the Lovable terms of service for more information.

## 🔗 Useful Links

- [Lovable Documentation](https://docs.lovable.dev/)
- [Lovable Community Discord](https://discord.com/channels/1119885301872070706/1280461670979993613)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)

## 📧 Support

For questions or issues:
- Open an issue in this repository
- Join the Lovable Discord community
- Check the [Lovable documentation](https://docs.lovable.dev/)

---

**Built with ❤️ using [Lovable](https://lovable.dev)**
