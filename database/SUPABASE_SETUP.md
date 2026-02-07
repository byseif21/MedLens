# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Project Name**: Smart Glass AI Medical
   - **Database Password**: (create a strong password)
   - **Region**: Choose closest to you
5. Click "Create new project" (wait 2-3 minutes)

## Step 2: Get Your Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

## Step 3: Update Frontend .env File

Update `Smart-Medical-Glass/frontend/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_URL=http://localhost:8000
```

## Step 4: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire content from `supabase-schema.sql`
4. Paste it into the SQL editor
5. Click "Run" or press `Ctrl+Enter`

## Step 5: Set Up Storage for Face Images

1. Go to **Storage** in Supabase dashboard
2. Click "Create a new bucket"
3. Name it: `face-images`
4. Make it **Public** (so backend can access images)
5. Click "Create bucket"

### Set Storage Policies:

Go to **Storage** → **Policies** → **face-images** bucket:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Users can upload face images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'face-images');

-- Allow public read access (for face recognition)
CREATE POLICY "Public can view face images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'face-images');
```

## Step 6: Enable Email Authentication

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. Configure email templates (optional)

## Step 7: Test Connection

Run your frontend:
```bash
cd MedLens/frontend
npm run dev
```

Open browser console and check for Supabase connection errors.

## Database Structure

### Tables:
- **users**: User credentials and basic info
- **medical_info**: Medical records (1-to-1 with users)
- **relatives**: Emergency contacts and external contacts (1-to-many with users)
- **user_connections**: Bidirectional connections between registered users
- **face_images**: Multiple face angles for better recognition

### Storage:
- **face-images**: Bucket for storing face photos

## Next Steps

After Supabase is set up:
1. Configure backend to connect to Supabase
2. Test registration flow
3. Test login flow
4. Test face recognition
