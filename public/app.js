// Initialize Mapbox
const map = new mapboxgl.Map({
  container: "map", // HTML element ID
  style: "mapbox://styles/mapbox/streets-v12", // Mapbox style
  center: [0, 0], // Default center
  zoom: 2, // Default zoom level
});

// Add Mapbox token
mapboxgl.accessToken = "pk.eyJ1IjoiaWFtdGFub3kiLCJhIjoiY202eDdpMXJtMDN6OTJyczF0ZTFobWExMyJ9.9EgLnSDxRIhgImJXHaAogA"; // Replace with your Mapbox token

let deviceMarker = null; // To store the device marker
let userMarker = null; // To store the user's marker
let routeLayerId = null; // To store the route layer ID

// Function to add or update the device marker
function updateDeviceMarker(latitude, longitude) {
  if (deviceMarker) {
    deviceMarker.remove(); // Remove the previous marker
  }
  deviceMarker = new mapboxgl.Marker({ color: "red" })
    .setLngLat([longitude, latitude])
    .addTo(map);

  // Draw or update the route between the user and the device
  drawRoute(userMarker.getLngLat(), [longitude, latitude]);
}

// Function to draw a route between two points
function drawRoute(start, end) {
  if (!start || !end) return;

  // Remove the previous route layer if it exists
  if (routeLayerId && map.getLayer(routeLayerId)) {
    map.removeLayer(routeLayerId);
    map.removeSource("route");
  }

  // Add a new route layer
  map.addSource("route", {
    type: "geojson",
    data: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [start, end],
      },
    },
  });

  routeLayerId = "route-layer";
  map.addLayer({
    id: routeLayerId,
    type: "line",
    source: "route",
    layout: {
      "line-join": "round",
      "line-cap": "round",
    },
    paint: {
      "line-color": "#3887be",
      "line-width": 5,
    },
  });
}

// Function to add the user's location marker
function addUserMarker(latitude, longitude) {
  if (userMarker) {
    userMarker.remove(); // Remove the previous marker
  }
  userMarker = new mapboxgl.Marker({ element: createCustomMarker() })
    .setLngLat([longitude, latitude])
    .addTo(map);

  // Center the map on the user's location initially
  map.flyTo({ center: [longitude, latitude], zoom: 10 });
}

// Function to create a custom marker using the human icon
function createCustomMarker() {
  const img = document.createElement("img");
  img.src = "/human-icon.png"; // Path to the human icon
  img.style.width = "40px";
  img.style.height = "40px";
  return img;
}

// WebSocket connection
const socket = io();

// Listen for location updates from the server
socket.on("locationUpdate", (data) => {
  const { latitude, longitude, deviceId } = data;

  // Update the table with live data
  document.getElementById("deviceId").textContent = deviceId;
  document.getElementById("latitude").textContent = latitude.toFixed(6);
  document.getElementById("longitude").textContent = longitude.toFixed(6);

  // Update the device marker on the map
  updateDeviceMarker(latitude, longitude);
});

// Get the user's current location
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude } = position.coords;
    addUserMarker(latitude, longitude);
  },
  (error) => {
    console.error("Error getting user location:", error);
  }
);
