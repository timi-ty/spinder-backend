# 🎵 Spindr 🎵

Welcome to **Spindr**! 

This is the backend repo. Refer here for the frontend repo [Spindr frontend](https://github.com/timi-ty/spinder-frontend).

*Disclaimer: I use the "var" keyword in this repo and have recently learned that it is bad paractice. It doesn't cause problems here because I use it only in global and function scope.*

This project brings the best of Spotify and Firebase together for a seamless and fun music discovery experience. Here's an overview of what makes Spindr special:

## 🚀 Features

### 🎧 Spotify + Firebase Authentication
Spindr uses the Spotify Authentication API combined with Firebase Custom Authentication. This means:
- **Spotify API**: Authenticate users with their Spotify account.
- **Firebase Client API**: Simultaneously authenticate users with Firebase for secure, real-time interactions.

### 🛣️ Express.js Route Groups
To keep things tidy and organized, Spindr leverages Express.js route groups:
- Routes are neatly grouped and modular, making the codebase easy to maintain and extend.

### 🛡️ Middleware Magic
Spindr uses a robust middleware setup to handle:
- **Authentication**: Ensures every request is securely authenticated.
- **CORS**: Properly configured to allow cross-origin requests from the frontend.
- **Rate Limiting**: Using `express-slow-down` to prevent abuse and ensure fair usage.

### 🔥 Firebase Presence Watcher
Stay connected with Spindr's presence feature:
- Utilizes Firebase Realtime Database to monitor user presence.
- Accurately tracks if a user is online or offline, enhancing real-time interactions.

## 🌐 Environment Setup

To get started with Spindr, follow these steps:

1. Clone the repository:
   ```sh
   git clone https://github.com/timi-ty/spinder-backend.git
   cd spinder-backend
   ```
2. Install dependencies:
```sh
npm install
```
3. Create a Spotify developer account and obtain your client id and client secret at [Spotify for developers](https://developer.spotify.com/dashboard). Also set up your redirect URI to match the one below.
4. Create a .env file with your configuration:
```
PORT=3000

SPOTIFY_CLIENT_ID="your-spotify-client-id"
SPOTIFY_CLIENT_SECRET="your-spotify-client-secret"
SPOTIFY_REDIRECT_URI="http://[backend-root-url]/api/login/callback"
SPOTIFY_ADMIN_UID="your-spotify-user-id"

FIREBASE_SERVICE_ACCOUNT_KEY={'key content here'}
FRONTEND_ROOT="http://[frontend-root-url]"
GRANT_ACCESS_URL="http://[backend-root-url]/api/login"
```
5. Run dev server
```sh
npm run dev
```

## 📂 Project Structure

Here's a glimpse of the organized structure of our main app:
```
├── app.js                   # Main application file
├── firebase/
│   └── firebase.spinder.js  # Firebase initialization
├── login/
│   └── login.router.js      # Login routes
├── user/
│   └── user.router.js       # User routes
├── discover/
│   └── discover.router.js   # Discovery routes
├── auth/
│   └── auth.router.js       # Authentication routes
└── app.middleware.js        # Middleware for handling errors and requests
```

## 🤝 Contributing

We welcome contributions! Feel free to submit issues and pull requests to help improve Spindr. Reach me at [timilehin.ty@gmail.com](timilehin.ty@gmail.com)

## 📄 License
This project is licensed under the GPL License - see the [LICENSE](LICENSE) file for details.

