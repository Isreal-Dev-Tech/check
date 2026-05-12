const express = require('express');
const { WebcastPushConnection } = require('tiktok-live-connector');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

// --- CONFIGURATION PANEL ---
const TIKTOK_USERNAME = "YOUR_USERNAME_HERE"; 
const WIN_DISTANCE = 10; // 100% of the screen
const COUNTRIES = [
    { id: 1, name: "Nigeria", flag: "🇳🇬", gift: "Rose", wins: 0, pos: 0 },
    { id: 2, name: "Ghana", flag: "🇬🇭", gift: "Coffee", wins: 0, pos: 0 },
    { id: 3, name: "USA", flag: "🇺🇸", gift: "Football", wins: 0, pos: 0 },
    { id: 4, name: "UK", flag: "🇬🇧", gift: "Ice Cream", wins: 0, pos: 0 }
    // Add more here up to 20...
];

app.use(express.static('public'));
app.use('/assets', express.static('assets'));

let tiktokConn = new WebcastPushConnection(TIKTOK_USERNAME);

tiktokConn.connect().then(() => console.log("Connected to TikTok!")).catch(err => console.log("Error:", err));

tiktokConn.on('gift', (data) => {
    let country = COUNTRIES.find(c => c.gift === data.giftName);
    if (country) {
        country.pos += data.repeatCount; // Move forward based on gifts
        
        // CHECK FOR WINNER
        if (country.pos >= WIN_DISTANCE) {
            country.wins += 1;
            country.pos = 0; // Reset for next lap
            io.emit('winner_alert', { name: country.name, wins: country.wins });
        }
        io.emit('update_race', COUNTRIES);
    }
});

http.listen(3000, () => console.log('Game running on port 3000'));
