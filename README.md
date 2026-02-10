# Sainik Defense College Website

A professional, full-stack school website for Sainik Defense College, Hingonia, Jaipur.

## Features

✅ **Modern React Frontend** - Single Page Application with smooth navigation
✅ **Node.js Backend** - Express server with RESTful APIs
✅ **SQLite Database** - Stores admission and contact form submissions
✅ **Responsive Design** - Works on all devices
✅ **Interactive Components** - Image sliders, news ticker, forms
✅ **Multiple Pages** - Home, About, Director's Desk, Academics, Admission, Facilities, Gallery, Results, Contact

## Tech Stack

- **Frontend**: React 18 (via CDN), HTML5, CSS3
- **Backend**: Node.js, Express.js
- **Database**: SQLite3 (better-sqlite3)
- **File Upload**: Multer

## Prerequisites

Make sure you have Node.js and npm installed on your computer:
- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installation & Setup

### Step 1: Install Dependencies

```bash
npm install
```

This will install:
- express
- better-sqlite3
- cors
- body-parser
- multer

### Step 2: Start the Server

```bash
npm start
```

Or alternatively:

```bash
node server.js
```

### Step 3: Open in Browser

Open your web browser and go to:
```
http://localhost:3000
```

## Project Structure

```
sainik-defense-college/
├── server.js                 # Node.js Express server
├── package.json             # Project dependencies
├── school.db               # SQLite database (auto-created)
├── public/                 # Frontend files
│   ├── index.html         # Main HTML file
│   ├── css/
│   │   └── styles.css     # All CSS styles
│   ├── js/
│   │   └── app.js         # React application
│   ├── uploads/           # Uploaded student photos
│   └── images/            # Static images
└── README.md              # This file
```

## API Endpoints

### GET Endpoints
- `GET /api/news` - Fetch latest news/updates
- `GET /api/admissions` - Get all admission applications (admin)
- `GET /api/contacts` - Get all contact messages (admin)

### POST Endpoints
- `POST /api/admission` - Submit admission form (with file upload)
- `POST /api/contact` - Submit contact form

## Features Explained

### 1. News Ticker
- Scrolling news bar at the top
- Fetches latest updates from database
- Auto-scrolling animation

### 2. Director's Desk
- Director's photo and message
- Professional layout
- You can replace the placeholder image with actual director photo

### 3. Admission Form
- Complete admission form with file upload
- Stores data in SQLite database
- Photo upload support
- Success message on submission

### 4. Image Slider
- Auto-rotating campus images
- Uses high-quality stock photos
- You can replace with actual school photos

### 5. Gallery
- Grid layout of campus images
- Hover effects
- Responsive design

### 6. Contact Form
- Contact information display
- Message submission form
- Stores messages in database

## Customization

### Changing School Name/Details
Edit `public/index.html` and `public/js/app.js`

### Adding Your Own Images
1. Place images in `public/images/` folder
2. Update image URLs in `public/js/app.js`

### Changing Colors
Edit CSS variables in `public/css/styles.css`:
```css
:root {
    --primary-color: #1a472a;
    --secondary-color: #d4af37;
    --accent-color: #8b0000;
}
```

### Adding Director Photo
Replace the placeholder URL in `DirectorsDeskPage` component in `app.js`

## Database Schema

### Admissions Table
- id (Primary Key)
- full_name
- email
- phone
- dob
- gender
- class
- father_name
- mother_name
- address
- previous_school
- hobbies
- photo_path
- created_at

### Contacts Table
- id (Primary Key)
- name
- email
- subject
- message
- created_at

### News Updates Table
- id (Primary Key)
- title
- content
- date
- created_at

## Production Deployment

For production deployment:

1. Change database to PostgreSQL/MySQL (recommended)
2. Add environment variables for sensitive data
3. Enable HTTPS
4. Add authentication for admin panel
5. Implement proper file upload validation
6. Add rate limiting for APIs

## Support

For any issues or questions, contact:
**Rahul Web Solutions**

---

## Credits

**Designed & Developed by Rahul Web Solutions**

© 2026 Sainik Defense College, Hingonia Jaipur. All Rights Reserved.
