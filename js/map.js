(function($, L) {

	"use strict"
	
	//object that displays map
	var map;
	//layers for map
	var baseMaps = {};
	var overlayMaps = {};
	//controls for map
	var control;
	//initialize unknown categories for rows and columns
	var table = {};

	//customizable features
	var defaultCategory = "Race"; //set initially selected layer
	var overlays = ["Victim's Gender", "Race", "Hit or Killed?", "Armed or Unarmed?"]; //set layers to select from
	var colors = ["Gray", "Blue", "Red", "Purple", "Orange", "Green", "Brown"];  //set colors of points

	//initialize map with tileLayer
	window.onload = function() {

		// Create map and set view
		map = L.map('container').setView([39.8282, -98.5795], 4);

		// Create a tile layer variable using the appropriate url
		var layer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png');
		layer.addTo(map);

		// add categories to baseMaps object
		for(var i = 0; i < overlays.length; i++) {
			baseMaps[overlays[i]] = new L.LayerGroup([]);
		}

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
		  		//builds overlayMaps for specified base layer
		  		buildMap(dat, defaultCategory);
		  		//creates base layers for each category, called after baseMaps and overlayMaps are created
		  		buildControls(defaultCategory);
		  		//create table
		  		buildTable(dat, defaultCategory);
		  		//add listener to controls
		  		map.on('baselayerchange', function() {
		  			//currently selected base layer
		  			var selected = $('input[type="radio"]:checked').next()[0].innerHTML.trim();
		  			buildMap(dat, selected);
		  			buildControls(selected);
		  			buildTable(dat, selected);
		  		});
		  	},
		  	dataType:'json'
		});
	};

	//creates base maps for each category
	//this bit of code is very hacky, not part of main challenge
	//limited by functions made available by leaflet for map and layerGroups
	var buildControls = function(selected) {
		//clear controls
		if(control) {		
			control.removeFrom(map);
		}
		//add controls to map
		control = L.control.layers(baseMaps, overlayMaps).addTo(map);
		
		//Broken, needs to be fixed, but not for final solution

		/*
		//select correct radiobutton
		var radio = $('input[type="radio"]');
		var index = 0;
		
		//clear old layers

		baseMaps[selected].addTo(map);
		for(var layer in baseMaps) {
			//select appropriate radiobutton
			var current = radio.next()[index].innerHTML.trim();
			if(current == selected) {
				radio[index].checked = "checked";
			}
			index++;
		} */

		//creates color legend for control
		var checkbox = $('input[type="checkbox"]');
		var index = 0;
		for(var layer in overlayMaps) {
			var current = checkbox.next()[index];
			var colorBox = document.createElement('span');
			colorBox.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'; //&#8226;';
			colorBox.style.backgroundColor = colors[index];
			colorBox.style.float = 'right';
			current.appendChild(colorBox);
			index++;
		}
	};

	// Loop through data and add appropriate layers and points
	var buildMap = function(data_points, selected) {
		//clear old layers first
		overlayMaps = {};
		map.eachLayer(function(layer) {
			if(!layer._tiles) {
				map.removeLayer(layer);
			}
		});

		//object to store layers names paired with their layerGroup arrays
		//{"name of layer": L.LayerGroup[..,incident,..], ..}
		overlayMaps["Unknown"] = new L.LayerGroup([]); //initialize unkown category
		overlayMaps["Unknown"].addTo(map);

		//iterate through incidents in JSON
		for(var incident in data_points) {
			var characteristic = data_points[incident][selected], //set layers categories
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
	var buildTable = function(data_points, selected) {
		//clears out table before reloading it
		table = {};
		document.getElementById('table').innerHTML = '';
		
		//table = {Male: {Black: 30, White: 20...}, Female: {Black: 20, White: 30}}
		for(var incident in data_points) {
			var row = data_points[incident]["Victim's Gender"]; //set rows
			var col = data_points[incident][selected]; //set columns
			
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
		var colHeader = document.createElement('th');
		colHeader.innerHTML = selected;
		header.appendChild(colHeader);
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
		console.log(rows);
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
}($, L));