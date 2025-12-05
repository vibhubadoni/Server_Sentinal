# 🎯 How to Run ServerSentinel - Complete Guide

## ✅ What You'll Get

A beautiful, fully-functional monitoring dashboard with:
- 🎨 **Stunning UI** with smooth animations
- 📊 **Real-time charts** showing CPU, Memory, Disk usage
- 🔔 **Live alerts** via WebSocket
- 🌓 **Dark/Light mode** toggle
- 📱 **Responsive design** works on all devices

---

## 🚀 EASIEST WAY (Windows)

### Just 2 Clicks!

1. **Make sure Docker Desktop is running** (install from docker.com if you don't have it)
2. **Double-click `START.bat`**
3. **Wait 30-60 seconds** while it starts
4. **Open browser**: http://localhost:5173

**Login:**
```
Email: admin@serversentinel.io
Password: password123
```

**To Stop:** Double-click `STOP.bat`

---

## 🐳 Using Docker Compose (All Platforms)

### Step 1: Install Docker Desktop
- Download from: https://www.docker.com/products/docker-desktop
- Install and start Docker Desktop
- Make sure it's running (you'll see the whale icon)

### Step 2: Start Application

Open terminal in the `ServerSentinel` folder:

```bash
docker-compose up -d
```

### Step 3: Wait & Access

Wait 30-60 seconds, then open:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

### Step 4: Login

```
Email: admin@serversentinel.io
Password: password123
```

### To Stop Everything:

```bash
docker-compose down
```

---

## 💻 Manual Setup (Without Docker)

### Prerequisites

1. **Node.js 20+**: Download from https://nodejs.org
2. **PostgreSQL 14+**: Download from https://www.postgresql.org
3. **Redis**: Download from https://redis.io

### Step 1: Setup Database

```bash
# Create database
createdb serversentinel

# Run schema
psql serversentinel < db/schema.sql
psql serversentinel < db/triggers.sql
psql serversentinel < db/seed.sql
```

### Step 2: Setup Backend

```bash
cd server

# Install dependencies
npm install

# Setup environment
copy .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npm run db:generate

# Start server
npm run dev
```

Backend will run on: http://localhost:3000

### Step 3: Setup Frontend

Open a NEW terminal:

```bash
cd client

# Install dependencies
npm install

# Setup environment
copy .env.example .env

# Start frontend
npm run dev
```

Frontend will run on: http://localhost:5173

### Step 4: Login

Open http://localhost:5173 and login:
```
Email: admin@serversentinel.io
Password: password123
```

---

## 🎨 What You'll See

### Dashboard Page
- **4 stat cards** showing active clients, alerts, CPU, and memory
- **Beautiful line chart** with real-time metrics
- **Recent alerts feed** with severity badges
- **Smooth animations** on every interaction

### Clients Page
- **Grid of client cards** showing all monitored servers
- **Status indicators** (active/inactive)
- **Last seen timestamps**
- **Hover effects** and smooth transitions

### Alerts Page
- **Full alert list** with filtering
- **Color-coded severity** (Critical, High, Medium, Low)
- **Acknowledge button** for open alerts
- **Real-time updates** via WebSocket

### Settings Page
- **Profile settings**
- **Notification preferences**
- **Security options**
- **System configuration**

---

## 🔧 Troubleshooting

### "Port 3000 is already in use"

```bash
# Windows
npx kill-port 3000

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### "Port 5173 is already in use"

```bash
# Windows
npx kill-port 5173

# Mac/Linux
lsof -ti:5173 | xargs kill -9
```

### "Cannot connect to database"

Make sure PostgreSQL is running:
```bash
# Check status
pg_isready

# Start PostgreSQL (if needed)
# Windows: Start from Services
# Mac: brew services start postgresql
# Linux: sudo systemctl start postgresql
```

### "Docker containers won't start"

```bash
# Stop everything
docker-compose down

# Remove old containers
docker-compose rm -f

# Start fresh
docker-compose up -d
```

### "Frontend shows blank page"

1. Check browser console (F12) for errors
2. Make sure backend is running (http://localhost:3000/health)
3. Clear browser cache and reload

### "npm install fails"

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules
rm -rf node_modules

# Reinstall
npm install
```

---

## 📱 Features to Try

1. **Toggle Dark Mode** - Click moon/sun icon in top bar
2. **View Real-time Charts** - Watch metrics update every 10 seconds
3. **Check Alerts** - See live alerts appear with animations
4. **Browse Clients** - Hover over client cards for effects
5. **Acknowledge Alerts** - Click acknowledge button on alerts
6. **Keyboard Shortcuts**:
   - `j/k` - Navigate alerts
   - `a` - Acknowledge selected alert
   - `/` - Focus search

---

## 🎉 You're All Set!

The application is now running with:
- ✅ Beautiful React frontend with Framer Motion animations
- ✅ Node.js backend with Express and WebSocket
- ✅ PostgreSQL database with sample data
- ✅ Redis for caching and queues
- ✅ Real-time monitoring and alerts

**Enjoy exploring ServerSentinel!** 🚀

---

## 📞 Need Help?

If something isn't working:
1. Check this guide again
2. Make sure Docker Desktop is running
3. Try `docker-compose down` then `docker-compose up -d`
4. Check the logs: `docker-compose logs -f`

Happy Monitoring! 🎊
