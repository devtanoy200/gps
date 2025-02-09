const mqtt = require("mqtt");
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

// Public HiveMQ broker details
const brokerUrl = "mqtt://broker.emqx.io:1883"; // TCP connection URL
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
    try {
        const data = JSON.parse(message.toString()); // Parse the message as JSON
        console.log(`📩 Message on ${topic}:`, data);

        // Convert lat and lon to numbers (if they are strings)
        const latitude = parseFloat(data.lat);
        const longitude = parseFloat(data.lon);
        const deviceId = data.Device_id;

        // Validate the parsed data
        if (isNaN(latitude) || isNaN(longitude) || !deviceId) {
            console.error("Invalid data format:", data);
            return;
        }

        // Add the received data to the locationData array
        locationData.push({ latitude, longitude, deviceId });

        // Emit the data to all connected clients via WebSocket
        io.emit("locationUpdate", { latitude, longitude, deviceId });
    } catch (error) {
        console.error("Failed to parse MQTT message:", message.toString(), error);
    }
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

// Export the HTTP server for Vercel
module.exports = httpServer;
