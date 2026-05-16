# Car Deposit - Premium Car Auction Platform

Car Deposit is a full-stack premium car auction application built with **Next.js**, **NestJS**, and **MongoDB**. It features real-time bidding, social authentication, and a clean, modern UI.

## 🚀 Live Demo
- **Frontend**: [https://your-frontend-link.vercel.app](https://your-frontend-link.vercel.app)
- **Backend**: [https://week5hackathone.onrender.com](https://week5hackathone.onrender.com)

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Styling**: Vanilla CSS (Custom Design System)
- **Icons**: Lucide React
- **Real-time**: Socket.io-client

### Backend
- **Framework**: NestJS
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT, Passport (Google & GitHub)
- **Real-time**: Socket.io (WebSockets)
- **File Storage**: Cloudinary
- **Emails**: Brevo (Sendinblue)

## 📁 Project Structure
```
.
├── bidding-backend/     # NestJS Backend API
└── bidding-frontend/    # Next.js Frontend Application
```

## ⚙️ Setup & Installation

### 1. Backend Setup
1. Navigate to `bidding-backend`.
2. Install dependencies: `npm install`
3. Configure `.env` file with your credentials (MongoDB, JWT, Cloudinary, Brevo, Social Login).
4. Run development server: `npm run start:dev`

### 2. Frontend Setup
1. Navigate to `bidding-frontend`.
2. Install dependencies: `npm install`
3. Configure environment variables (e.g., `NEXT_PUBLIC_API_URL`).
4. Run development server: `npm run dev`

## 🌟 Key Features
- **Real-time Bidding**: Instant bid updates via WebSockets.
- **Social Login**: One-click registration with Google and GitHub.
- **Wishlist**: Save your favorite cars to your profile.
- **Admin Notifications**: Automated emails for newsletter subscriptions and contact forms.
- **Responsive Design**: Premium UI optimized for all devices.

## 📄 License
This project is licensed under the MIT License.
