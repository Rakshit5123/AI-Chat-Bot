# Starting MongoDB with Docker - Step by Step

## Current Issue
Docker Desktop is starting but not fully initialized yet. This is normal and can take 1-2 minutes.

## Manual Steps (Do these in your terminal)

### Step 1: Wait for Docker Desktop to Fully Start

Open Docker Desktop from your taskbar and wait until you see "Docker Desktop is running" (green icon in bottom-left).

### Step 2: Pull MongoDB Image

Once Docker is ready, run:

```powershell
docker pull mongo:latest
```

### Step 3: Start MongoDB Container

```powershell
docker run -d `
  --name chatbot-mongodb `
  -p 27017:27017 `
  -e MONGO_INITDB_DATABASE=chatbotDB `
  mongo:latest
```

### Step 4: Verify MongoDB is Running

```powershell
docker ps
```

You should see a container named `chatbot-mongodb` running.

### Step 5: Update .env File

Edit `.env` and change the MONGO_URI line to:

```env
MONGO_URI=mongodb://localhost:27017/chatbotDB
```

### Step 6: Restart Your Server

```powershell
cd "E:\AI Chat Bot\AI Chat Bot\ChatbotMaker"
npm run dev
```

You should now see:
```
✅ MongoDB connected successfully
🚀 Server running on http://localhost:5000
```

## Quick Commands Reference

### Stop MongoDB
```powershell
docker stop chatbot-mongodb
```

### Start MongoDB (if stopped)
```powershell
docker start chatbot-mongodb
```

### Remove MongoDB Container
```powershell
docker stop chatbot-mongodb
docker rm chatbot-mongodb
```

### View MongoDB Logs
```powershell
docker logs chatbot-mongodb
```

### Connect to MongoDB Shell
```powershell
docker exec -it chatbot-mongodb mongosh
```

## Troubleshooting

### If Docker Desktop won't start:
1. Restart your computer
2. Or try: `Restart-Service docker` in PowerShell (as Administrator)
3. Or manually restart Docker Desktop from Windows Services

### If port 27017 is already in use:
```powershell
# Find what's using the port
Get-NetTCPConnection -LocalPort 27017

# Use a different port
docker run -d --name chatbot-mongodb -p 27018:27017 mongo:latest
# Then update .env: MONGO_URI=mongodb://localhost:27018/chatbotDB
```

### If you get "container name already exists":
```powershell
docker rm chatbot-mongodb
# Then run the docker run command again
```

## Alternative: Use In-Memory Storage (Already Working!)

Your server is **already working** with in-memory storage. If Docker is giving you trouble, you can just keep using in-memory storage for development:

- ✅ No setup needed
- ✅ Fast and simple
- ⚠️ Data is lost when server restarts (but that's fine for testing)

Just run:
```powershell
npm run dev
```

And start using your Cohere chatbot immediately!
