# 🧪 Testing ServerSentinel - Step by Step

## ✅ Pre-Test Checklist

Before testing, make sure:
- [ ] Node.js 20+ is installed (`node --version`)
- [ ] You're in the ServerSentinel directory
- [ ] No other apps are using ports 3000 or 5173

---

## 🚀 Test 1: Install Dependencies

### Backend:
```bash
cd server
npm install
```

**Expected:** Should install without errors

### Frontend:
```bash
cd ../client
npm install
```

**Expected:** Should install without errors

---

## 🚀 Test 2: Start Backend

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
🔌 WebSocket server listening on ws://0.0.0.0:3000/ws
✅ No external database needed - using in-memory storage
✅ Sample data loaded and ready to use
🔑 Login credentials:
   Email: admin@serversentinel.io
   Password: password123
```

**If you see errors:**
- Port 3000 in use: Run `npx kill-port 3000`
- Module errors: Delete `node_modules` and run `npm install` again

---

## 🚀 Test 3: Test Backend API

Open a new terminal and test:

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Expected: {"success":true,"data":{"status":"healthy",...}}
```

---

## 🚀 Test 4: Start Frontend

```bash
cd client
npm run dev
```

**Expected Output:**
```
VITE v5.0.11  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## 🚀 Test 5: Open in Browser

1. Open: **http://localhost:5173**
2. You should see the login page

**Expected:**
- Beautiful login form
- ServerSentinel logo
- Email and password fields

---

## 🚀 Test 6: Login

**Credentials:**
```
Email: admin@serversentinel.io
Password: password123
```

**Expected:**
- Login successful
- Redirects to dashboard
- Shows 4 stat cards
- Shows charts
- Shows recent alerts

---

## 🚀 Test 7: Test Features

### Dashboard:
- [ ] See 4 stat cards (Active Clients, Open Alerts, Avg CPU, Avg Memory)
- [ ] See line chart with metrics
- [ ] See recent alerts list
- [ ] All animations work smoothly

### Dark Mode:
- [ ] Click moon icon in top bar
- [ ] Page switches to dark mode
- [ ] Click sun icon to switch back

### Clients Page:
- [ ] Click "Clients" in sidebar
- [ ] See 3 client cards
- [ ] Cards show: Production Server 1, Database Server, Application Server
- [ ] Hover effects work

### Alerts Page:
- [ ] Click "Alerts" in sidebar
- [ ] See 2 alerts
- [ ] Alerts show severity badges (CRITICAL, HIGH)
- [ ] Click "Acknowledge" button (should work for admin)

### Settings Page:
- [ ] Click "Settings" in sidebar
- [ ] See 4 setting cards
- [ ] Cards are clickable with hover effects

---

## 🚀 Test 8: WebSocket (Real-time)

1. Keep browser open on Dashboard
2. In backend terminal, you should see WebSocket connection logs
3. Alerts should appear in real-time (if any are generated)

**Expected:**
- WebSocket connects successfully
- No connection errors in browser console (F12)

---

## 🚀 Test 9: API Endpoints

Test all API endpoints:

```bash
# Login (get token)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@serversentinel.io","password":"password123"}'

# Copy the accessToken from response, then:

# Get clients
curl http://localhost:3000/api/clients \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get metrics
curl http://localhost:3000/api/metrics \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Get alerts
curl http://localhost:3000/api/alerts \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Expected:** All should return JSON with `"success": true`

---

## 🚀 Test 10: Browser Console Check

1. Open browser console (F12)
2. Go to Console tab
3. Check for errors

**Expected:**
- No red errors
- Maybe some info logs (that's OK)
- WebSocket connection successful

---

## ✅ Success Criteria

All tests pass if:
- ✅ Backend starts without errors
- ✅ Frontend starts without errors
- ✅ Login works
- ✅ Dashboard shows data
- ✅ All pages load correctly
- ✅ Dark mode works
- ✅ No console errors
- ✅ WebSocket connects
- ✅ API endpoints respond

---

## 🐛 Common Issues & Fixes

### "Port already in use"
```bash
npx kill-port 3000
npx kill-port 5173
```

### "Module not found"
```bash
cd server
rm -rf node_modules package-lock.json
npm install

cd ../client
rm -rf node_modules package-lock.json
npm install
```

### "Cannot find module 'uuid'"
```bash
cd server
npm install uuid
npm install --save-dev @types/uuid
```

### "TypeScript errors"
These are just warnings - the app will still run!

### "WebSocket connection failed"
- Make sure backend is running
- Check CORS settings in `.env.simple`
- Try refreshing the browser

---

## 📊 Test Results Template

Copy and fill this out:

```
=== ServerSentinel Test Results ===

Date: ___________
Tester: ___________

✅ / ❌  Backend Installation
✅ / ❌  Frontend Installation
✅ / ❌  Backend Starts
✅ / ❌  Frontend Starts
✅ / ❌  Login Works
✅ / ❌  Dashboard Loads
✅ / ❌  Clients Page Works
✅ / ❌  Alerts Page Works
✅ / ❌  Settings Page Works
✅ / ❌  Dark Mode Works
✅ / ❌  WebSocket Connects
✅ / ❌  No Console Errors

Overall: PASS / FAIL

Notes:
_________________________________
_________________________________
```

---

## 🎉 If All Tests Pass

**Congratulations!** 🎊

Your ServerSentinel is working perfectly!

You now have:
- ✨ Beautiful monitoring dashboard
- 📊 Real-time charts
- 🔔 Live alerts
- 🌓 Dark mode
- 📱 Responsive design
- 💾 In-memory storage (no database needed!)

**Enjoy your monitoring dashboard!** 🚀
