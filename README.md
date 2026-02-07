# Money History App 💰

A comprehensive debt and expense management system built with Next.js, Tailwind CSS, and Supabase.

## Features 🚀

- **Expense Tracking**: Manage your daily expenses with category-wise breakdown.
- **Debt Management**: Track "I Lent" (আমি পাব) and "I Owe" (আমি দেব) lists with repayment history.
- **Cloud Sync**: Securely sync your data with Supabase for cross-device access.
- **Multi-language Support**: Support for both Bengali and English.
- **Offline First**: Works offline using localStorage with background cloud sync.
- **Advanced Calculations**: Built-in expression evaluation (e.g., `1000+500`) for all amount fields.
- **Modern UI**: Beautiful glassmorphism UI with Dark Mode support.

## Tech Stack 🛠️

- **Framework**: Next.js 15+
- **Styling**: Tailwind CSS
- **Database/Auth**: Supabase
- **Icons**: Lucide React
- **Charts**: Recharts

## Setup & Deployment 🌐

### Local Development
1. Clone the repository.
2. Install dependencies: `npm install`
3. Create a `.env.local` file based on `.env.local.example`.
4. Run the development server: `npm run dev`

### Netlify Deployment
This project is pre-configured for Netlify deployment.
1. Push the code to GitHub.
2. Connect the repository to Netlify.
3. Add the following Environment Variables in Netlify:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXTAUTH_SECRET`
