# Team Task Management Web Application

**A full-stack collaborative task management platform that enables users to create projects, invite team members, assign tasks, and monitor progress efficiently.
**---

## Features

* User Authentication (JWT)
* Role-based access (Admin / Member)
* Project creation & joining (invite code)
* Task management (create, assign, update status)
* Dashboard analytics
* Full-stack deployment on Vercel

---

## Tech Stack

**Frontend**

* React (Vite)
* Axios
* CSS (custom UI)

**Backend**

* Node.js
* Express.js (Serverless on Vercel)
* MongoDB Atlas
* JWT Authentication

---

## Project Structure

```
team-task-manager/
│
├── api/                # Backend (serverless functions)
│   └── index.js
│
├── src/                # Frontend (React)
│   ├── pages/
│   ├── components/
│   └── ...
│
├── vercel.json
├── package.json
└── README.md
```

---

## Environment Variables

Create a `.env` file in root:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

---

## Run Locally

### Install dependencies

```
npm install
```

---

### Start development server

```
npm run dev
```

This runs:

* Backend → `http://localhost:5000`
* Frontend → `http://localhost:5173`

---

### Open browser

```
http://localhost:5173
```

---

## API Base URL

Frontend uses:

```
/api
```

Vite proxy handles local routing
Vercel handles production routing

---

## Deploy on Vercel

### Push code to GitHub

```
git add .
git commit -m "deploy"
git push
```

---

### Import project in Vercel

* Go to https://vercel.com
* Click **New Project**
* Select repository
* Deploy

---

### Add Environment Variables in Vercel

Go to:

**Project Settings → Environment Variables**

Add:

```
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
```

---

### Configure MongoDB Atlas

* Go to Network Access
* Add IP:

```
0.0.0.0/0
```

---

### Access App

```
https://your-project.vercel.app
```

---

## Important Notes

* Do NOT commit `.env` file
* Use `.env.example` for sharing config
* Ensure MongoDB Atlas is accessible
* Backend runs as serverless functions

---

## Future Improvements

* Drag & Drop task board
* Real-time updates (Socket.IO alternative)
* Notifications system
* File attachments
* Activity logs

---

## Author

MODSU SHASHANK REDDY

---

