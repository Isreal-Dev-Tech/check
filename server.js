const { TikTokLive } = require('@tiktool/live');
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
const TARGET_USERNAME = "mynameanabel"; // Put your username here
const POINTS_PER_LAP = 20;

// All country data is now right here - no config.json needed!
let countriesList = [
    { id: 1, name: "Nigeria", flag: "🇳🇬", gift: "Rose", wins: 0, score: 0, currentPos: 0 },
    { id: 2, name: "Ghana", flag: "🇬🇭", gift: "Finger Heart", wins: 0, score: 0, currentPos: 0 },
    { id: 3, name: "South Africa", flag: "🇿🇦", gift: "TikTok", wins: 0, score: 0, currentPos: 0 },
    { id: 4, name: "Kenya", flag: "🇰🇪", gift: "GG", wins: 0, score: 0, currentPos: 0 },
    { id: 5, name: "Egypt", flag: "🇪🇬", gift: "Ice Cream", wins: 0, score: 0, currentPos: 0 },
    { id: 6, name: "Morocco", flag: "🇲🇦", gift: "Doughnut", wins: 0, score: 0, currentPos: 0 },
    { id: 7, name: "Senegal", flag: "🇸🇳", gift: "Heart Me", wins: 0, score: 0, currentPos: 0 },
    { id: 8, name: "Ethiopia", flag: "🇪🇹", gift: "Panda", wins: 0, score: 0, currentPos: 0 },
    { id: 9, name: "Algeria", flag: "🇩🇿", gift: "Chili", wins: 0, score: 0, currentPos: 0 },
    { id: 10, name: "Uganda", flag: "🇺🇬", gift: "Mic", wins: 0, score: 0, currentPos: 0 },
    { id: 11, name: "Ivory Coast", flag: "🇨🇮", gift: "Coffee", wins: 0, score: 0, currentPos: 0 },
    { id: 12, name: "Cameroon", flag: "🇨🇲", gift: "Baseball", wins: 0, score: 0, currentPos: 0 },
    { id: 13, name: "Rwanda", flag: "🇷🇼", gift: "Tennis", wins: 0, score: 0, currentPos: 0 },
    { id: 14, name: "Tanzania", flag: "🇹🇿", gift: "Fire", wins: 0, score: 0, currentPos: 0 },
    { id: 15, name: "Angola", flag: "🇦🇴", gift: "Hand Wave", wins: 0, score: 0, currentPos: 0 },
    { id: 16, name: "Tunisia", flag: "🇹🇳", gift: "Paper Crane", wins: 0, score: 0, currentPos: 0 },
    { id: 17, name: "Mali", flag: "🇲🇱", gift: "Football", wins: 0, score: 0, currentPos: 0 },
    { id: 18, name: "DR Congo", flag: "🇨🇩", gift: "Lightning", wins: 0, score: 0, currentPos: 0 },
    { id: 19, name: "Burkina Faso", flag: "🇧🇫", gift: "Gamepad", wins: 0, score: 0, currentPos: 0 },
    { id: 20, name: "Zambia", flag: "🇿🇲", gift: "Diamond", wins: 0, score: 0, currentPos: 0 }
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

        // Advanced Gift Checking Logic
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

        // Update the stats
        country.score += countToProcess;
        
        // Update Wins (Leaderboard rank)
        country.wins = Math.floor(country.score / POINTS_PER_LAP);
        
        // Update Visual Position (0-85% for the pitch)
        country.currentPos = ((country.score % POINTS_PER_LAP) / POINTS_PER_LAP) * 85;

        console.log(`🎁 GIFT: ${data.uniqueId} sent ${countToProcess}x ${data.giftName} for ${country.name}`);

        // Sort by Wins first, then current score
        const sortedRace = [...countriesList].sort((a, b) => {
            if (b.wins !== a.wins) return b.wins - a.wins;
            return b.score - a.score;
        });

        io.emit('updateRace', {
            allCountries: sortedRace,
            senderName: data.uniqueId
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
                
