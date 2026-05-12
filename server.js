const { TikTokLive } = require('./node_modules/@tiktool/live/dist/index.js');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ===============================
// SETTINGS
// ===============================
const TIKTOOL_API_KEY = "tk_91ec88c2870958d10d58fbcfe4e73840d018705e201a96c1";
const TARGET_USERNAME = "realjadrolita"; // Put your username here
const POINTS_PER_LAP = 50;

// All country data is now right here - no config.json needed!
let countriesList = [
    { id: 1, name: "Nigeria", flag: "🇳🇬", gift: "Rose", giftIcon: "🌹", wins: 0, score: 0, currentPos: 0 },
    { id: 2, name: "Ghana", flag: "🇬🇭", gift: "Finger Heart", giftIcon: "🫰", wins: 0, score: 0, currentPos: 0 },
    { id: 3, name: "South Africa", flag: "🇿🇦", gift: "TikTok", giftIcon: "🎵", wins: 0, score: 0, currentPos: 0 },
    { id: 4, name: "Kenya", flag: "🇰🇪", gift: "GG", giftIcon: "🎮", wins: 0, score: 0, currentPos: 0 },
    { id: 5, name: "Egypt", flag: "🇪🇬", gift: "Ice Cream", giftIcon: "🍦", wins: 0, score: 0, currentPos: 0 },
    { id: 6, name: "Morocco", flag: "🇲🇦", gift: "Doughnut", giftIcon: "🍩", wins: 0, score: 0, currentPos: 0 },
    { id: 7, name: "Senegal", flag: "🇸🇳", gift: "Heart Me", giftIcon: "🫶", wins: 0, score: 0, currentPos: 0 },
    { id: 8, name: "Ethiopia", flag: "🇪🇹", gift: "Panda", giftIcon: "🐼", wins: 0, score: 0, currentPos: 0 },
    { id: 9, name: "Algeria", flag: "🇩🇿", gift: "Chili", giftIcon: "🌶️", wins: 0, score: 0, currentPos: 0 },
    { id: 10, name: "Uganda", flag: "🇺🇬", gift: "Mic", giftIcon: "🎤", wins: 0, score: 0, currentPos: 0 },
    { id: 11, name: "Ivory Coast", flag: "🇨🇮", gift: "Coffee", giftIcon: "☕", wins: 0, score: 0, currentPos: 0 },
    { id: 12, name: "Cameroon", flag: "🇨🇲", gift: "Baseball", giftIcon: "⚾", wins: 0, score: 0, currentPos: 0 },
    { id: 13, name: "Rwanda", flag: "🇷🇼", gift: "Tennis", giftIcon: "🎾", wins: 0, score: 0, currentPos: 0 },
    { id: 14, name: "Tanzania", flag: "🇹🇿", gift: "Fire", giftIcon: "🔥", wins: 0, score: 0, currentPos: 0 },
    { id: 15, name: "Angola", flag: "🇦🇴", gift: "Hand Wave", giftIcon: "👋", wins: 0, score: 0, currentPos: 0 },
    { id: 16, name: "Tunisia", flag: "🇹🇳", gift: "Paper Crane", giftIcon: "🦢", wins: 0, score: 0, currentPos: 0 },
    { id: 17, name: "Mali", flag: "🇲🇱", gift: "Football", giftIcon: "⚽", wins: 0, score: 0, currentPos: 0 },
    { id: 18, name: "DR Congo", flag: "🇨🇩", gift: "Lightning", giftIcon: "⚡", wins: 0, score: 0, currentPos: 0 },
    { id: 19, name: "Burkina Faso", flag: "🇧🇫", gift: "Gamepad", giftIcon: "🕹️", wins: 0, score: 0, currentPos: 0 },
    { id: 20, name: "Zambia", flag: "🇿🇲", gift: "Diamond", giftIcon: "💎", wins: 0, score: 0, currentPos: 0 }
];


app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, 'public')));

// The advanced tracker from the other code
let giftComboTracker = {};

// ===============================
// TIKTOK CONNECTION LOGIC
// ===============================
const tiktok = new TikTokLive({
    uniqueId: TARGET_USERNAME,
    apiKey: TIKTOOL_API_KEY,
    autoReconnect: true,
    signServerUrl: "https://api.tik.tools"
});

tiktok.on('gift', (data) => {
    // ... [keep your combo tracking code here] ...

    const country = countriesList.find(c => c.gift.toLowerCase() === data.giftName.toLowerCase());
    if (!country) return;

    // 1. Add points
    country.score += countToProcess;
    
    // 2. Calculate Wins (Every 50 points = 1 Win)
    // This is what updates the podium!
    country.wins = Math.floor(country.score / POINTS_PER_LAP);
    
    // 3. Update Position for the runner (0-85%)
    country.currentPos = ((country.score % POINTS_PER_LAP) / POINTS_PER_LAP) * 85;

    // 4. THE FIX: Sort strictly by WINS first. 
    // This ensures the person with 5 wins stays at 1st place 
    // even if they just started a new lap.
    const sortedByChampions = [...countriesList].sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins; // Highest wins first
        return b.score - a.score; // If wins are tied, who is further in the current lap
    });

    io.emit('updateRace', {
        allCountries: sortedByChampions
    });
});



tiktok.on('connected', () => console.log(`✅ Game Connected: ${TARGET_USERNAME}`));
tiktok.on('error', (err) => console.error("❌ TIKTOK ERROR:", err));

tiktok.connect().catch(() => {});

io.on('connection', (socket) => {
    socket.emit('updateRace', { allCountries: countriesList });
});

server.listen(3000, () => {
    console.log("🚀 SERVER READY: http://localhost:3000");
});
                
