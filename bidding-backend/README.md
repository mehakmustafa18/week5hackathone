# Car Deposit Backend

The backend for the Car Deposit auction platform, built with **NestJS**.

## Features
- **REST API**: Comprehensive endpoints for cars, bids, and profiles.
- **WebSocket Gateway**: Real-time bid and notification relay.
- **Social Auth**: Google and GitHub OAuth 2.0 integration.
- **File Uploads**: Cloudinary integration for car images.
- **Automated Emails**: Newsletter and contact form processing via Brevo.

## Environment Variables
Required variables for production:
- `MONGO_URI`: MongoDB Atlas connection string.
- `JWT_SECRET`: Secret for signing JWT tokens.
- `BACKEND_URL`: Live URL of the backend (for OAuth callbacks).
- `FRONTEND_URL`: Live URL of the frontend (for redirects).
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`
- `CLOUDINARY_CLOUD_NAME` / `API_KEY` / `API_SECRET`
- `BREVO_API_KEY`: For email services.

## Installation
```bash
npm install
```

## Running the app
```bash
# development
npm run start:dev

# production
npm run start:prod
```

## Deployment
Recommended platforms: **Render**, **Railway**, or **Vercel Functions**.
Ensure all environment variables are set in the dashboard.
