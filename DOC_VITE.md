# DOC_VITE.MD - Frontend Architecture (Vite + React)

This document summarizes the frontend stack and integration logic for the Site Gloliver Lobo application.

## 1. Tech Stack
- **Build Tool**: [Vite](https://vitejs.dev/) (v5+)
- **Framework**: [React](https://react.dev/) (v18+)
- **Language**: TypeScript
- **Styling**: TailwindCSS + Shadcn/UI (Radix Primitives)
- **Backend Client**: `@supabase/supabase-js`

## 2. Directory Structure (`/src`)
- `components/`: UI building blocks (UploadSection, FeaturedSection, Header).
- `pages/`: Route views (Index, Settings).
- `hooks/`: Custom logic (`useAuth`, `useSiteConfig`).
- `contexts/`: Global state (`AuthContext`).
- `lib/`: Configuration (`supabase.ts` initialization).

## 3. Environment Variables
Vite uses `.env` files. Variables accessible to the client must start with `VITE_`.
- `VITE_SUPABASE_URL`: API URL.
- `VITE_SUPABASE_ANON_KEY`: Public API Key.

**Critical Note**: These keys are visible in the browser bundle. Do NOT store "Service Role" (Secret) keys here.

## 4. Supabase Integration
The client is initialized in `src/lib/supabase.ts`.

### Initialization Pattern
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Auth State
- Managed by `AuthContext.tsx`.
- Listens to `supabase.auth.onAuthStateChange`.
- Provides `user` object properly typed.

## 5. Deployment (Vercel/Netlify)
- **Build Command**: `npm run build` (runs `tsc && vite build`).
- **Output Dir**: `dist`.
- **SPA Fallback**: Configure rewrites to `index.html` for client-side routing.

## 6. Common Issues
- **Micro-Rollback**: If `package.json` dependencies mismatch, run `npm install` before dev.
- **Cache**: Vite caches aggressively. Use `Ctrl+Shift+R` or clear browser data when testing Auth flows.
- **Types**: Ensure explicit types for Supabase responses to avoid `any` usage.

## 7. Performance Nuances
- **Images**: Use `.webp` where possible.
- **Audio**: Streaming large files directly from Supabase Storage is efficient (Ranges supported).
