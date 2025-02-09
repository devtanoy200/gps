// Set your Mapbox access token
mapboxgl.accessToken = 'pk.eyJ1IjoiaWFtdGFub3kiLCJhIjoiY202eDdpMXJtMDN6OTJyczF0ZTFobWExMyJ9.9EgLnSDxRIhgImJXHaAogA'; // Replace with your Mapbox access token

// Initialize the Mapbox map
const map = new mapboxgl.Map({
    container: 'map', // The ID of the <div> element where the map will be displayed
    style: 'mapbox://styles/mapbox/streets-v12', // Map style
    center: [90.18522333333335, 24.09163333333334], // Default center
    zoom: 10, // Default zoom level
});

// Add navigation controls (zoom in/out buttons)
map.addControl(new mapboxgl.NavigationControl());

// Variable to store the user's chosen zoom level
let userZoomLevel = map.getZoom();

// Load zoom level from localStorage on page load
const savedZoomLevel = localStorage.getItem('userZoomLevel');
if (savedZoomLevel) {
    map.setZoom(parseFloat(savedZoomLevel));
    userZoomLevel = parseFloat(savedZoomLevel);
}

// Listen for user zoom events
map.on('zoomend', () => {
    userZoomLevel = map.getZoom();
    localStorage.setItem('userZoomLevel', userZoomLevel);
});

// Function to create a custom marker with a human icon
function createHumanMarker() {
    console.log("Creating human marker...");
    const el = document.createElement('div');
    el.className = 'custom-marker';
    el.style.backgroundImage = "url('/human-icon.png')"; // Ensure this path is correct
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.backgroundSize = 'cover';
    return el;
}

// Function to add and track the user's real-time location
function trackUserLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser.");
        return;
    }

    let userMarker;

    navigator.geolocation.watchPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            console.log("User location:", { latitude, longitude });

            if (!userMarker) {
                userMarker = new mapboxgl.Marker({
                    element: createHumanMarker()
                })
                    .setLngLat([longitude, latitude])
                    .setPopup(new mapboxgl.Popup().setHTML(
                        `<h3>Your Location</h3><p>Lat: ${latitude}, Lon: ${longitude}</p>`
                    ))
                    .addTo(map);

                console.log("User marker added to map.");

                // Center the map on the user's location
                map.flyTo({
                    center: [longitude, latitude],
                    zoom: userZoomLevel,
                    essential: true,
                });
            } else {
                userMarker.setLngLat([longitude, latitude]);
                console.log("User marker updated.");
            }
        },
        (error) => {
            console.error("Geolocation error:", error.message);
            alert(`Geolocation error: ${error.message}`);
        },
        {
            enableHighAccuracy: true,
            maximumAge: 10000,
            timeout: 5000,
        }
    );
}

// Call the function to start tracking the user's location
trackUserLocation();

// Connect to the WebSocket server
const socket = io('https://peppy-daifuku-4aa536.netlify.app'); // Replace with your backend server URL

// Variable to store the latest MQTT marker
let mqttMarker;

// Function to update the single row in the table
function updateTableRow(data) {
    document.getElementById("deviceId").textContent = data.deviceId || "-";
    document.getElementById("latitude").textContent = data.latitude || "-";
    document.getElementById("longitude").textContent = data.longitude || "-";
}

// Listen for location updates from the server
socket.on("locationUpdate", (data) => {
    const { deviceId, latitude, longitude } = data;

    // Update the single row in the table
    updateTableRow({ deviceId, latitude, longitude });

    // Remove the previous MQTT marker if it exists
    if (mqttMarker) {
        mqttMarker.remove(); // Remove the old marker from the map
    }

    // Add a new marker for the latest location
    mqttMarker = new mapboxgl.Marker()
        .setLngLat([longitude, latitude]) // Set the marker's position
        .setPopup(new mapboxgl.Popup().setHTML(
            `<h3>Device ID: ${deviceId}</h3><p>Lat: ${latitude}, Lon: ${longitude}</p>`
        )) // Add a popup with details
        .addTo(map); // Add the marker to the map

    // Pan to the new location on the map (without changing the zoom level)
    map.panTo([longitude, latitude], {
        duration: 2000, // Animation duration in milliseconds (2 seconds)
        easing(t) {
            return t; // Linear easing for smooth panning
        }
    });

    // Ensure the zoom level remains fixed at the user's chosen level
    map.setZoom(userZoomLevel);
});