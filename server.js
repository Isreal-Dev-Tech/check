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
    try {
        if (!data) return;
        
        const trackingId = `${data.userId}_${data.giftName}`;
        let countToProcess = 0;

        if (data.repeatEnd) {
            countToProcess = data.repeatCount - (giftComboTracker[trackingId] || 0);
            delete giftComboTracker[trackingId];
        } else {
            countToProcess = data.repeatCount - (giftComboTracker[trackingId] || 0);
            giftComboTracker[trackingId] = data.repeatCount;
        }

        if (countToProcess <= 0) return;

        const country = countriesList.find(c => c.gift.toLowerCase() === data.giftName.toLowerCase());
        if (!country) return;

        // 1. Update points & wins
        country.score += countToProcess;
        country.wins = Math.floor(country.score / POINTS_PER_LAP);
        country.currentPos = ((country.score % POINTS_PER_LAP) / POINTS_PER_LAP) * 85;

        // 2. CREATE THE TOP RANK (This is for the Podium only)
        // We sort a COPY so the original tracks don't move
        const topRank = [...countriesList].sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.score - a.score;
        });

        // 3. SEND BOTH: The original list for tracks, and the sorted list for the podium
        io.emit('updateRace', {
            allCountries: countriesList, // Stays in original 1-20 order
            topRank: topRank             // Sorted for the leaderboard
        });

    } catch (err) {
        console.error("❌ GIFT ERROR:", err);
    }
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
                
