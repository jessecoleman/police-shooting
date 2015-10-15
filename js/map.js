(function($, L) {
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
	};

	// Function for getting data
	var getData = function() {

	  // Execute an AJAX request to get the data in data/response.js
	  $.ajax({
	  	url:'../data/response.json',
	  	type: "get",
	  	success:customBuild(),
	  	dataType:"json"
	  });

	  // When your request is successful, call your customBuild function

	}

	// Loop through your data and add the appropriate layers and points
	var customBuild = function() {
		var responseJson = JSON.parse(this.responseText);
		//object to store layers names paired with their layerGroup arrays
		var layers = {};
		//iterate through incidents in responseJson
		for(var incident in responseJson) {
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
		for(var layer in layers) {
			layer.addTo(map);
		}
		// Once layers are on the map, add a leaflet controller that shows/hides layers
	  	L.control.layers(null, layers).addTo(map);
	}
}());


