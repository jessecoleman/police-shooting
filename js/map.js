// Function to draw your map
window.onload = function() {

  // Create map and set view
  var map = L.map('container').setView([39.8282, -98.5795], 4);

  // Create a tile layer variable using the appropriate url
  var layer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png');

  // Add the layer to your map
  layer.addTo(map);

  // Execute your function to get data
  getData();
}

// Function for getting data
var getData = function() {

  // Execute an AJAX request to get the data in data/response.js
  $.get('../data/response.json', customBuild());

  // When your request is successful, call your customBuild function

}

// Loop through your data and add the appropriate layers and points
var customBuild = function() {
	var responseJson = JSON.parse(this.responseText);
	//object to store layers names paired with their layerGroup arrays
	var layers = {};
	//iterate through incidents in responseJson
	for(var incident : responseJson) {
		//initializes layer if it doesn't already exist
		if(!layers[incident.Gender]) {
			layers[incident.Gender] = new L.LayerGroup([]);
		}
		//creates circle populated with incident attributes
		var circle = new L.circleMarker([incident.lat, incident.long]).bindPopout(incident.Summary);
		circle.color = incident.Gender == "Male" ? blue : red;
		circle.addTo(layers[incident.Gender]);
	}

	// Be sure to add each layer to the map
	for(Object layer : layers) {
		layer.addTo(map);
	}
	// Once layers are on the map, add a leaflet controller that shows/hides layers
  	L.control.layers(null, layers).addTo(map);
}

function categorizeLayers(element, index, array) {
	if(!layers.contains(element.Gender)) {
		layers.add(new L.LayerGroup([]))
	}
	
	var circle = new L.circleMarker([element.lat, element.long]).bindPoput(element.Summary)
	if(element.Gender == "Male") {
		console.log(element["Victim Name"]);
		circle.color = "blue";
		circle.addTo(layerMale);
	} else {
		circle.color = "red";
		circle.addTo(layerFemale);
	}
}

