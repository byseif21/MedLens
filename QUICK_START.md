# Quick Start Guide - Smart Glass AI Medical System

## 🎯 Complete Setup in 3 Steps

### Step 1: Supabase Setup (15 minutes)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Wait for setup to complete

2. **Run Database Schema**
   - Go to SQL Editor in Supabase
   - Copy content from `database/supabase-schema.sql`
   - Run the SQL

3. **Create Storage Bucket**
   - Go to Storage
   - Create bucket named `face-images`
   - Make it public

4. **Get API Credentials**
   - Go to Settings → API
   - Copy Project URL and anon key

### Step 2: Backend Setup (10 minutes)

1. **Install Dependencies**
   ```bash
   cd Smart-Medical-Glass/backend
   pip install -r requirements.txt
   ```

2. **Configure Environment**
   Edit `backend/.env`:
   ```env
   SUPABASE_URL=your-project-url
   SUPABASE_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   SECRET_KEY=change-this-to-random-string
   ```

3. **Start Backend**
   ```bash
   python main.py
   ```
   
   Should see: `Uvicorn running on http://0.0.0.0:8000`

4. **Test Backend**
   Open: `http://localhost:8000/api/health`

### Step 3: Frontend Setup (5 minutes)

1. **Configure Environment**
   Edit `frontend/.env`:
   ```env
   VITE_SUPABASE_URL=your-project-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_API_URL=http://localhost:8000
   ```

2. **Start Frontend**
   ```bash
   cd Smart-Medical-Glass/frontend
   npm run dev
   ```
   
   Should see: `Local: http://localhost:5173/`

3. **Open Application**
   Open browser: `http://localhost:5173`

## ✅ Testing the Application

### Test 1: Registration

1. Click "Register New User"
2. Fill in:
   - Name: Test User
   - Email: test@example.com
   - Password: test123
   - Age: 25
   - Gender: Male
3. Click "Next: Capture Face"
4. Choose "Capture with Camera"
5. Capture 5 angles (front, left, right, up, down)
6. Click "Complete Registration"

**Expected**: Success message → Redirect to login

### Test 2: Email Login

1. On login page, use "Email Login" tab
2. Enter:
   - Email: test@example.com
   - Password: test123
3. Click "Login"

**Expected**: Redirect to dashboard with your profile

### Test 3: Face ID Login

1. On login page, click "Face ID" tab
2. Choose "Capture with Camera"
3. Capture your face

**Expected**: Recognize you → Redirect to dashboard

### Test 4: Update Profile

1. In dashboard, go to "Main Info" tab
2. Click "Edit"
3. Update some fields
4. Click "Save"

**Expected**: Data saved successfully

### Test 5: Add Medical Info

1. Go to "Medical Info" tab
2. Click "Edit"
3. Add allergies, medications, etc.
4. Click "Save"

**Expected**: Medical info saved

### Test 6: Add Connections

1. Go to "Connections" tab
2. Click "Add Connection"
3. Choose "Search Existing User" or "External Contact"
4. Fill in connection details
5. Click "Add Connection"

**Expected**: Connection added successfully

### Test 7: Face Recognition (Smart Glass Feature)

1. Click "Recognize Face" button
2. Capture/upload another person's face
3. View their profile

**Expected**: Shows recognized person's complete profile

## 🎉 You're Done!

Your Smart Glass AI Medical System is now fully functional!

## 📊 System Architecture

```
Frontend (React)
    ↓
Backend API (FastAPI)
    ↓
Supabase (Database + Storage)
    ↓
Face Recognition (face_recognition library)
```

## 🔧 Common Issues

### Backend won't start
- Check Python version (3.8+)
- Install dependencies: `pip install -r requirements.txt`
- Check `.env` file exists and has correct values

### Frontend shows white screen
- Check browser console for errors
- Verify `.env` has correct Supabase credentials
- Restart dev server

### Face not recognized
- Ensure good lighting
- Face should be clearly visible
- Try multiple angles
- Lower tolerance in backend `.env`: `FACE_RECOGNITION_TOLERANCE=0.5`

### CORS errors
- Add frontend URL to backend `.env` CORS_ORIGINS
- Restart backend server

## 📚 Documentation

- **Backend API**: `http://localhost:8000/docs`
- **Supabase Setup**: `database/SUPABASE_SETUP.md`

## 🚀 What's Next?

1. **Add more users** - Register family members
2. **Test recognition** - Try recognizing different people
3. **Update medical info** - Add detailed medical records
4. **Add emergency contacts** - Set up relatives
5. **Deploy to production** - Follow production deployment guide

## 💡 Tips

- **Better Recognition**: Use multi-angle capture (5 angles)
- **Security**: Change SECRET_KEY in production
- **Performance**: Lower tolerance for faster recognition
- **Accuracy**: Higher tolerance for better accuracy

## 🆘 Need Help?

1. Check console output for errors
2. Test health endpoint: `http://localhost:8000/api/health`
3. Review API docs: `http://localhost:8000/docs`
4. Check Supabase dashboard for data
5. Verify all environment variables are set

---

**Congratulations! Your Smart Glass AI Medical System is ready to use!** 🎊
