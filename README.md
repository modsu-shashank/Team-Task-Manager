# Team Task Management Web Application

A full-stack collaborative task management platform that enables users to create projects, invite team members, assign tasks, and monitor progress efficiently.


## Features

* User Authentication (JWT)
* Role-based access (Admin / Member)
* Project creation and joining via invite codes
* Task management (create, assign, update status)
* Dashboard analytics for tracking progress
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

## Running the Project Locally

### Install dependencies

```
npm install
```

---

### Start development server

```
npm run dev
```

This will start:

* Backend → `http://localhost:5000`
* Frontend → `http://localhost:5173`

---

### Access tge browser

```
http://localhost:5173
```

---

## API Base URL

Frontend uses:

```
/api
```

Vite handles routing in development
Vercel manages routing in production

---

## Deployment on Vercel

### Push code to GitHub

```
git add .
git commit -m "deploy"
git push
```

---

### Deploy via Vercel
* Go to https://vercel.com
* Click New Project
* Select your repository
* Deploy

---

### Add Environment Variables in Vercel

Navigate to:

**Project Settings → Environment Variables**

Add:

```
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
```

---

### MongoDB Atlas Setup

* Navigate to Network Access
* Add the following IP:

```
0.0.0.0/0
```

---

### Access the depolyed application

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
<img width="1890" height="822" alt="image" src="https://github.com/user-attachments/assets/681150f0-c70a-4507-828c-fc07d5a6d0ab" />

<img width="1891" height="828" alt="image" src="https://github.com/user-attachments/assets/1b4f90d9-e140-44f8-a2a1-b439faa76fbb" />

