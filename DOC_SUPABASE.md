# DOC_SUPABASE.MD - Backend Architecture & Best Practices

This document outlines the **Supabase** backend structure for the application, strictly following official documentation and best practices (RLS, Storage, Security).

## 1. Authentication & Users
Supabase uses the `auth` schema. We do NOT modify `auth.users` directly. Instead, we sync user data to a public `profiles` table.

- **Trigger**: Automatically creates a `profile` row when a new user signs up. (Optional, currently handled by app logic on login).
- **Admin**: Identified by specific email (`gloliverlobo@gmail.com`) or custom claim.

## 2. Row Level Security (RLS)
Every table MUST have RLS enabled. Policies determine "Who can do What".

### Naming Convention
Policies should be descriptive: `Policy Name [Action] [Role]`.
*Example: "Public Read Media", "Admin Update Config".*

### Recommended Policies
#### A. Public Data (Read-Only)
Data visible to everyone (Guest + Logged Users).
```sql
CREATE POLICY "Public Read [Table]"
ON [table] FOR SELECT
TO public
USING (true);
```

#### B. User Data (Own)
Data only the owner can modify.
```sql
CREATE POLICY "User Update Own [Table]"
ON [table] FOR UPDATE
TO authenticated
USING (auth.uid() = user_id); -- Check row ownership
```

#### C. Admin Data (All)
Data only Admins can touch (Configuration, Deleting other users' content).
```sql
CREATE POLICY "Admin All [Table]"
ON [table] FOR ALL
TO authenticated
USING (public.is_admin()); -- Custom function
```

## 3. Storage (Buckets)
Storage buckets (`media`, `fan_club`) behave like tables for RLS, but have a flag `public`.

- **Public Bucket**: `true` (Allows HTTP access via `getPublicUrl`).
- **RLS on `storage.objects`**: Controls who can UPLOAD (INSERT) or DELETE.

**Critical Rule**:
*Even if a bucket is Public, you can restrict Uploads using RLS.*

## 4. Database Schema

### `public.profiles`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | uuid | FK to `auth.users` |
| `email` | text | |
| `is_blocked` | bool | Default `false` |

### `public.media_files`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | uuid | PK |
| `title` | text | |
| `file_path` | text | Path in Storage |
| `type` | text | 'audio', 'video', 'image' |
| `genre` | text | Metadata |
| `uploaded_by` | uuid | FK to `profiles.id` |
| `thumbnail` | text | URL (optional) |

### `public.site_config`
| Column | Type | Notes |
| :--- | :--- | :--- |
| `id` | uuid | PK |
| `key` | text | Unique (e.g., 'featured_pages') |
| `value` | jsonb | Flexible data storage |

## 5. Security & Helper Functions

### `is_admin()`
To avoid repeating email checks, define a standard function:
```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() ->> 'email') = 'gloliverlobo@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
*Note: `SECURITY DEFINER` runs the function with the privileges of the creator (postgres/superuser), allowing access to secure data if needed, but here it just checks JWT.*

## 6. Common Pitfalls (To Avoid in VITE)
- **403 on Public Data**: Usually happens if the client *thinks* it's logged in (sends token) but the session is invalid. Supabase rejects the *request* before checking RLS.
  - **Fix**: Handle auth errors in Client or ensure Session is valid.
- **400 on Public URL**: Bucket is Private.
  - **Fix**: Set `public = true` in `storage.buckets`.
