const mqtt = require("mqtt");
const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

// Public HiveMQ broker details
const brokerUrl = "mqtt://broker.hivemq.com:1883"; // TCP connection URL
const options = {
    clientId: "mqttClient-" + Math.random().toString(16).substring(2, 8), // Generate a random client ID
    clean: true,
    reconnectPeriod: 1000, // Reconnect interval in milliseconds
    connectTimeout: 30 * 1000, // Connection timeout in milliseconds
};

// Replace with your desired MQTT topic
const topic = "812921/gps";

// Connect to the public MQTT broker
const client = mqtt.connect(brokerUrl, options);

let locationData = []; // Store received location data

client.on("connect", () => {
    console.log("✅ Connected to public MQTT broker");
    client.subscribe(topic, (err) => {
        if (err) {
            console.error("❌ Subscription error:", err);
        } else {
            console.log("📡 Subscribed to topic:", topic);
        }
    });
});

client.on("message", (topic, message) => {
    const data = JSON.parse(message.toString()); // Assuming the message is in JSON format
    console.log(`📩 Message on ${topic}:`, data);

    // Add the received data to the locationData array
    locationData.push(data);

    // Emit the data to all connected clients via WebSocket
    io.emit("locationUpdate", data);
});

client.on("error", (err) => {
    console.error("⚠ MQTT Error:", err);
});

client.on("reconnect", () => {
    console.log("🔄 Reconnecting...");
});

client.on("close", () => {
    console.log("🔌 Connection closed");
});

// Serve static files (HTML, CSS, JS)
app.use(express.static("public"));

// API endpoint to get all location data
app.get("/api/locations", (req, res) => {
    res.json(locationData);
});

// Start the server
const PORT = 3000;
http.listen(PORT, () => {
    console.log(`🌐 Server running at http://localhost:${PORT}`);
});