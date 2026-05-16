# Car Deposit Frontend

The frontend application for the Car Deposit auction platform, built with **Next.js**.

## Features
- **Dynamic Auction Lists**: Filter by make, category, and price.
- **Real-time Updates**: Live bid tracking using Socket.io.
- **User Dashboard**: Manage bids, cars, and wishlist.
- **Premium Design**: Modern, responsive UI with custom CSS.

## Environment Variables
- `NEXT_PUBLIC_API_URL`: The URL of your live backend API.

## Installation
```bash
npm install
```

## Running the app
```bash
# development
npm run dev

# production build
npm run build
```

## Deployment
Recommended platform: **Vercel**.
Ensure `NEXT_PUBLIC_API_URL` is set in Vercel settings before building.
