# SETUP.MD - Settings & Functionality Reference

This document analyzes the current state of **Settings.tsx** and its related components (`UploadSection.tsx`, `useSiteConfig.ts`) to serve as a baseline for backend restructuring.

## 1. Overview
The **Settings Page** (`/settings`) is the administrative hub of the application. It manages:
- **User Accounts**: List, block, delete users (Admin only).
- **Media Library**: List and delete uploaded files.
- **Storage**: Statistics and cleanup of old files.
- **Site Configuration**:
  - **Featured Pages**: Manage "Destaques" carousel items (Video/Audio/Image).
  - **Social Links**: Update social media URLs.
  - **Audio Visualizer**: Customize the player aesthetic.
- **Uploads** (`UploadSection`): Upload new media to the library.

## 2. Components Structure

### A. UserManagement
- **Purpose**: Manage registered users (`profiles` table).
- **Features**:
  - List users (email, status, created_at).
  - Block/Unblock users (`is_blocked` flag).
  - Delete users (Hard delete from `profiles`).
- **Permissions**: Admin Only.

### B. MediaManagement
- **Purpose**: Global file manager.
- **Features**:
  - List all files from `media_files`.
  - Delete files (removes from DB + Storage).
- **Permissions**: Admin Only.

### C. StorageManagement
- **Purpose**: Storage health check.
- **Features**:
  - Show total size/file count (via `getStorageInfo` util).
  - Cleanup logic (`cleanupOldFilesByAge`).
- **Permissions**: Admin Only.

### D. Settings (Main Component)
- **Purpose**: Manage dynamic site content.
- **State Management**: Uses `useSiteConfig` hook to sync with `site_config` table.
- **Keys Managed**:
  - `featured_pages` (Array of Arrays): 8 slots per page. containing `{ id, title, url, type, genre, thumbnail }`.
  - `social_links` (JSON): URLs for Instagram, YouTube, etc.
  - `audio_settings` (JSON): Visualizer colors/sizes.

### E. UploadSection (Component)
- **Purpose**: Upload interface.
- **Features**:
  - File Dropzone.
  - Form: Title, Type (Audio/Video/Image), Genre, Featured Slot, Page.
  - **Logic**:
    1. Uploads file to Supabase Storage (`media`).
    2. Inserts metadata into `media_files`.
    3. *Updates* `featured_pages` config if selected.
- **Permissions**: Admin Only (enforced by `useAuth` check).

## 3. Data Requirements (Supabase)

### Tables
| Table | Description | RLS Policy Needed |
| :--- | :--- | :--- |
| `profiles` | User identity & status | Public Read, User Update Own, Admin Editor All |
| `media_files` | Metadata for uploads | Public Read, Auth Insert, Owner/Admin Delete |
| `site_config` | Key-Value store for App Config | Public Read, Admin Write (ALL) |
| `activity_logs` | Admin notifications | Admin Read/Write |

### Storage Buckets
| Bucket | Public? | Notes |
| :--- | :--- | :--- |
| `media` | **YES** | Stores MP3/MP4/Images. Must be publicly accessible for playback. |
| `fan_club` | **YES** | Stores fan content (future feature). |

## 4. Current Variables & Constants
- **Admin Email**: `gloliverlobo@gmail.com` (Hardcoded in `AuthContext` and Policies).
- **Default Featured**: 8 Slots initialized.
- **Supabase URL**: Defined in `.env.local` (`VITE_SUPABASE_URL`).

## 5. Identified Issues (To Fix in Refactor)
- **403 Errors**: Frontend fails when loading `site_config` if auth session is invalid/expired.
- **400 Errors**: Storage buckets sometimes default to Private, breaking playback.
- **Hallucinated Policies**: Previous SQL scripts used inconsistent policy names.
- **Complexity**: `UploadSection` mixes generic upload logic with Specific "Featured" update logic.

## 6. Refactoring Goals
- **Graceful Degradation**: `useSiteConfig` should swallow Auth errors and return Defaults (or Public data) without crashing.
- **Strict Security**: Use `SUPABASE_MASTER_SETUP.sql` as the single source of truth.
- **Simplified Upload**: Ensure `UploadSection` handles Thumbnails correctly (already patched).
