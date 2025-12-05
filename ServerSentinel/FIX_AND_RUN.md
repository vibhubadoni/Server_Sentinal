# 🔧 Fix All Errors & Run ServerSentinel

## ⚠️ About TypeScript Errors

The IDE shows TypeScript errors because dependencies aren't installed yet. **This is normal!**
Once you run `npm install`, all these errors will disappear.

---

## ✅ Step-by-Step Fix & Run Guide

### Step 1: Install Backend Dependencies

```bash
cd server
npm install
npm install --save-dev @types/node @types/uuid
```

**This will fix:**
- ✅ "Cannot find module 'http'"
- ✅ "Cannot find module 'express'"
- ✅ "Cannot find module 'uuid'"
- ✅ "Cannot find type definition file for 'node'"
- ✅ All other backend TypeScript errors

### Step 2: Install Frontend Dependencies

```bash
cd ../client
npm install
```

**This will fix:**
- ✅ "Cannot find module 'framer-motion'"
- ✅ "Cannot find module '@tanstack/react-query'"
- ✅ "Cannot find module 'lucide-react'"
- ✅ All other frontend TypeScript errors

---

## 🚀 Step 3: Start Backend

```bash
cd server
npm run dev
```

**Expected Output:**
```
✅ In-memory database initialized with sample data
   Users: 3
   Clients: 3
   Metrics: 60
   Alerts: 2
🚀 ServerSentinel API started
📊 API available at http://0.0.0.0:3000
```

**If you see errors:**

### Error: "Port 3000 already in use"
```bash
npx kill-port 3000
```

### Error: "Cannot find module"
```bash
# Delete and reinstall
rm -rf node_modules package-lock.json
npm install
npm install --save-dev @types/node @types/uuid
```

---

## 🚀 Step 4: Start Frontend (New Terminal)

```bash
cd client
npm run dev
```

**Expected Output:**
```
VITE v5.0.11  ready in XXX ms
➜  Local:   http://localhost:5173/
```

**If you see errors:**

### Error: "Port 5173 already in use"
```bash
npx kill-port 5173
```

---

## 🎉 Step 5: Open & Test

1. Open browser: **http://localhost:5173**
2. Login:
   - Email: `admin@serversentinel.io`
   - Password: `password123`
3. Explore the dashboard!

---

## 📋 Quick Checklist

Before starting, make sure:
- [ ] Node.js 20+ installed (`node --version`)
- [ ] You're in the ServerSentinel directory
- [ ] No apps using ports 3000 or 5173

---

## 🐛 Common Errors & Solutions

### 1. TypeScript Errors in IDE
**Cause:** Dependencies not installed
**Fix:** Run `npm install` in both server and client folders

### 2. "Cannot find module 'uuid'"
```bash
cd server
npm install uuid --save
npm install @types/uuid --save-dev
```

### 3. "Module not found" at runtime
```bash
# Clear everything and reinstall
cd server
rm -rf node_modules package-lock.json
npm install

cd ../client
rm -rf node_modules package-lock.json
npm install
```

### 4. "EADDRINUSE: Port already in use"
```bash
# Kill the port
npx kill-port 3000  # for backend
npx kill-port 5173  # for frontend
```

### 5. Backend starts but frontend can't connect
- Check backend is running on port 3000
- Check CORS settings in server/.env.simple
- Try refreshing browser

### 6. WebSocket connection fails
- Make sure backend started successfully
- Check browser console (F12) for errors
- Verify no firewall blocking localhost

---

## ✅ Success Indicators

### Backend Running Successfully:
```
✅ In-memory database initialized
🚀 ServerSentinel API started
📊 API available at http://0.0.0.0:3000
🔌 WebSocket server listening
```

### Frontend Running Successfully:
```
VITE v5.0.11  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Browser Working:
- Login page loads
- Can login successfully
- Dashboard shows data
- No red errors in console (F12)

---

## 🎯 Quick Test Commands

After starting both servers, test the API:

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Expected: {"success":true,"data":{"status":"healthy",...}}

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@serversentinel.io","password":"password123"}'

# Expected: {"success":true,"data":{"accessToken":"...",...}}
```

---

## 📱 What You Should See

### Login Page:
- ServerSentinel logo
- Email and password fields
- "Sign in" button
- Demo credentials shown

### Dashboard:
- 4 stat cards (Active Clients, Open Alerts, CPU, Memory)
- Line chart with metrics
- Recent alerts list
- Smooth animations

### All Pages:
- Sidebar with navigation
- Top bar with user info
- Dark mode toggle (moon/sun icon)
- Responsive design

---

## 🎊 If Everything Works

**Congratulations!** 🎉

You now have a fully functional monitoring dashboard with:
- ✨ Beautiful UI with animations
- 📊 Real-time charts
- 🔔 Live alerts
- 🌓 Dark mode
- 💾 In-memory storage (no database!)

**Enjoy!** 🚀

---

## 📞 Still Having Issues?

1. Make sure Node.js 20+ is installed
2. Delete all `node_modules` folders
3. Run `npm install` in both server and client
4. Restart both servers
5. Clear browser cache
6. Try in incognito/private mode

---

## 💡 Pro Tips

- Use `npm run dev` for development (auto-reload)
- Press `Ctrl+C` to stop servers
- Data resets when you restart (it's in-memory)
- Check browser console (F12) for errors
- Backend logs show all API requests

---

**Ready to start? Run the commands above!** 🚀
