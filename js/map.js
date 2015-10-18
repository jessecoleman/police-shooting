//(function($, L) {

	L.Control.ActiveLayers=L.Control.Layers.extend({getActiveBaseLayer:function(){return this._activeBaseLayer},getActiveOverlayLayers:function(){return this._activeOverlayLayers},onAdd:function(a){var b=L.Control.Layers.prototype.onAdd.call(this,a);return this._activeBaseLayer=this._findActiveBaseLayer(),this._activeOverlayLayers=this._findActiveOverlayLayers(),b},_findActiveBaseLayer:function(){var a=this._layers;for(var b in a)if(this._layers.hasOwnProperty(b)){var c=a[b];if(!c.overlay&&this._map.hasLayer(c.layer))return c}throw new Error("Control doesn't have any active base layer!")},_findActiveOverlayLayers:function(){var a={},b=this._layers;for(var c in b)if(this._layers.hasOwnProperty(c)){var d=b[c];d.overlay&&this._map.hasLayer(d.layer)&&(a[c]=d)}return a},_onLayerChange:function(){L.Control.Layers.prototype._onLayerChange.apply(this,arguments),this._recountLayers()},_onInputClick:function(){this._handlingClick=!0,this._recountLayers(),L.Control.Layers.prototype._onInputClick.call(this),this._handlingClick=!1},_recountLayers:function(){var a,b,c,d=this._form.getElementsByTagName("input"),e=d.length;for(a=0;e>a;a++)b=d[a],c=this._layers[b.layerId],b.checked&&!this._map.hasLayer(c.layer)?c.overlay?this._activeOverlayLayers[b.layerId]=c:this._activeBaseLayer=c:!b.checked&&this._map.hasLayer(c.layer)&&c.overlay&&delete this._activeOverlayLayers[b.layerId]}}),L.control.activeLayers=function(a,b,c){return new L.Control.ActiveLayers(a,b,c)};

	//"use strict"
	
	//object that displays map
	var map;
	//layers for map
	var baseMaps = {};
	var overlayMaps = {};
	//map control object
	//var control;

	//initialize map with tileLayer
	window.onload = function() {

		// Create map and set view
		map = L.map('container').setView([39.8282, -98.5795], 4);

		// Create a tile layer variable using the appropriate url
		var layer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png');

		// Add layer to map
		layer.addTo(map);

		//get data
		getData();
	};

	// Performs ajax request
	var getData = function() {
		// Execute an AJAX request to get the data in data/response.js
		$.ajax({
		  	url:'data/response.json',
		  	type: 'get',
		  	success: function(dat) {
		  		//creates base layers for each category
		  		buildControls(dat);
		  		//builds overlay layers for specified base layer
		  		updateOverlays(dat);
		  		//add controls to map
				var control = L.control.layers(baseMaps, overlayMaps).addTo(map);
		  		//create table
		  		buildTable(dat);
		  		//add listener to controls
		  		map.on('baselayerchange', function() {
		  			console.log(control.getActiveBaseLayer());
		  		});
		  	},
		  	dataType:'json'
		});
	};

	
	//creates base maps for each category
	var buildControls = function(data) {
		//categories that can be selected for
		var overlays = ["Victim's Gender", "Victim's Age", "Hit or Killed?", "Armed or Unarmed?", "Weapon"];
		for(var i = 0; i < overlays.length; i++) {
			baseMaps[overlays[i]] = new L.LayerGroup([]);
		}
	};

	//Unfinished, dynamically update overlay layers based on base layers
	var updateOverlays = function(data_points) {
		var selected = null;
		buildMap(data_points, selected);
		//return $('input[type="radio"]:checked').name;
	}

	// Loop through data and add appropriate layers and points
	var buildMap = function(data_points, selected) {
		//object to store layers names paired with their layerGroup arrays
		//{"name of layer": L.LayerGroup[..,incident,..], ..}
		overlayMaps["Unknown"] = new L.LayerGroup([]); //initialize unkown category
		overlayMaps["Unknown"].addTo(map);

		//iterate through incidents in JSON
		for(var incident in data_points) {
			var characteristic = data_points[incident]["Victim's Gender"], //set layers categories
			lat = data_points[incident].lat,
			lng = data_points[incident].lng,
			smry = data_points[incident].Summary +
				   " <a href=" + data_points[incident]["Source Link"] + ">link</a>";

			//creates circle with properties configured
			var circle = new L.circleMarker([lat, lng]).bindPopup(smry);

			//if incident has a defined value for characteristic
			if(characteristic) {
				//if characteristic isn't a LayerGroup yet
				if(!overlayMaps[characteristic]) {
					//creates new LayerGroup with characteristic
					overlayMaps[characteristic] = new L.LayerGroup([]);
					//displays LayerGroup on map
					overlayMaps[characteristic].addTo(map);
				}
				circle.addTo(overlayMaps[characteristic]);
			} 
			//if characteristic is undefined, add to undefined list
			else {
				circle.addTo(overlayMaps["Unknown"]);
			}
			//sets color for index
			var colors = ["Gray", "Red", "Orange", "Yellow", "Green"];  //set colors of points
			var index = 0;
			for(var layer in overlayMaps) {
				if(characteristic == layer) {
					circle.setStyle({color: colors[index], radius: "5"});
				}
				index++;
			}	
		}	
	};

	//builds cross-tabulated data-structure and then puts its data into table
	var buildTable = function(data_points) {
		//table = {Male: {Black: 30, White: 20...}, Female: {Black: 20, White: 30}}
		//initialize unknown categories for rows and columns
		var table = {"Unknown": {"Unknown": 0}};

		for(var incident in data_points) {
			var row = data_points[incident]["Victim's Gender"]; //set rows
			var col = data_points[incident]["Race"]; //set columns
			
			//if victim's gender is defined
			if(row) {
				if(!table[row]) {
					table[row] = {};
				}
			} else {
				row = "Unknown";
			}
			//if victim's race is defined
			if(col) {
				if(!table[row][col]) {
					table[row][col] = 0;
				}
			} else {
				col = "Unknown";
			}
			table[row][col]++;
		}

		//create table header
		var header = document.createElement('tr');
		//empty row1 col1
		header.innerHTML += ('<th>Race</th>');
		//set containing all category rows
		var rows = new Set();
		//create 
		for(var col in table) {
			var cell = document.createElement('th');
			cell.innerHTML = col;
			header.appendChild(cell);
			//adds all unique categories to set
			for(var row in table[col]) {
				rows.add(row); 
			}
		}
		//append header to table
		$('#table').append(header);

		//sort rows
		var sortedRows = [];
		for(var index of rows) {
			sortedRows.push(index);
		}
		sortedRows.sort();

		//iterate through array
		for(var category of sortedRows) {
			var row = document.createElement('tr');
			var contents = document.createElement('td');
			contents.innerHTML = category;
			row.appendChild(contents);
			for(var col in table) {
				var cell = document.createElement('td');
				if(table[col][category]) {
					cell.innerHTML = table[col][category];
				} else {
					cell.innerHTML = '-'
				}
				row.appendChild(cell);
			}
			//append each row
			$('#table').append(row);
		}
	}

//}($, L));