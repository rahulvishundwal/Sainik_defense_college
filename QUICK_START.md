# Quick Start Guide - Sainik Defense College Website

## For Users Who Already Have Node.js Installed

### Step 1: Extract the ZIP file
Extract `sainik-defense-college.zip` to your desired location

### Step 2: Open Terminal/Command Prompt
- **Windows**: Press `Win + R`, type `cmd`, press Enter
- **Mac/Linux**: Open Terminal application

### Step 3: Navigate to Project Folder
```bash
cd path/to/sainik-defense-college
```

### Step 4: Install Dependencies
```bash
npm install
```

Wait for all packages to download and install (this may take 1-2 minutes)

### Step 5: Start the Server
```bash
npm start
```

You should see:
```
✅ Server running on http://localhost:3000
📚 Sainik Defense College Website
🔧 Developed by Rahul Web Solutions
```

### Step 6: Open in Browser
Open your web browser and go to:
```
http://localhost:3000
```

## That's it! Your website is now running! 🎉

## To Stop the Server
Press `Ctrl + C` in the terminal

## To Restart the Server
```bash
npm start
```

## Troubleshooting

### Port 3000 already in use?
Edit `server.js` and change:
```javascript
const PORT = 3000;
```
to
```javascript
const PORT = 8080;  // or any other port
```

### Dependencies not installing?
Make sure you have Node.js 14 or higher:
```bash
node --version
```

If version is lower, download latest from: https://nodejs.org/

---

## No New Dependencies Required!

Since you mentioned you already have npm and Node.js installed, all dependencies in `package.json` will be installed with a simple `npm install` command:

- express (Web server)
- better-sqlite3 (Database)
- cors (API security)
- body-parser (Form handling)
- multer (File uploads)

**React is loaded from CDN**, so no React installation needed!

---

**Need Help?** Contact Rahul Web Solutions
