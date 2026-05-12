const express = require('express');
const { WebcastPushConnection } = require('tiktok-live-connector');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// --- CONFIGURATION PANEL ---
const TIKTOK_USERNAME = "fasasi_isreal"; // Change this to a LIVE user
const WIN_DISTANCE = 100; 

let COUNTRIES = [
    { id: 1, name: "Nigeria", flag: "🇳🇬", gift: "Rose", wins: 0, pos: 0 },
    { id: 2, name: "Ghana", flag: "🇬🇭", gift: "Coffee", wins: 0, pos: 0 },
    { id: 3, name: "USA", flag: "🇺🇸", gift: "Football", wins: 0, pos: 0 },
    { id: 4, name: "UK", flag: "🇬🇧", gift: "Ice Cream", wins: 0, pos: 0 }
];

app.use(express.static('public'));
app.use('/assets', express.static('assets'));

// Set up connection with specific mobile headers to avoid timeouts
let tiktokConn = new WebcastPushConnection(TIKTOK_USERNAME, {
    processInitialData: false,
    enableExtendedGiftInfo: true,
    requestOptions: {
        timeout: 20000 // Increase timeout to 20 seconds for slow mobile data
    }
});

// Better Connection Logic
function connectToTikTok() {
    tiktokConn.connect()
        .then(state => {
            console.log(`✅ Success! Connected to ${TIKTOK_USERNAME} (Room: ${state.roomId})`);
        })
        .catch(err => {
            console.error("❌ Connection failed. Retrying in 10 seconds...");
            setTimeout(connectToTikTok, 10000); 
        });
}

connectToTikTok();

tiktokConn.on('gift', (data) => {
    let country = COUNTRIES.find(c => c.gift === data.giftName);
    if (country) {
        // Move forward based on gift amount
        country.pos += data.repeatCount; 
        
        if (country.pos >= WIN_DISTANCE) {
            country.wins += 1;
            country.pos = 0; 
            io.emit('winner_alert', { name: country.name, wins: country.wins });
        }
        io.emit('update_race', COUNTRIES);
    }
});

// Handle if TikTok kicks you out
tiktokConn.on('disconnected', () => {
    console.log("⚠️ Disconnected from TikTok. Reconnecting...");
    connectToTikTok();
});

http.listen(3000, () => {
    console.log('🚀 Server active at http://localhost:3000');
});
