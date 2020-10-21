mapboxgl.accessToken = 'pk.eyJ1IjoibWlrYWVsYmV2ZW50b3JwIiwiYSI6ImNrZWk3Zjd3MTB6aGYyd2xwYnI3Ymg1bWQifQ.L6fIgo8558gZKn7cechaJA';
var map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mikaelbeventorp/ckggkbo7w07ol19s6yiyhlbou',
    center: [16.4683766, 59.6196616], // starting position
    zoom: 7 // starting zoom
});


// Mousemove coordinates, funkar.
map.on('mousemove', function (e) {
document.getElementById('info').innerHTML = '<strong>Mousehover coordinates:</strong> <br /> ' + 
    // e.point is the x, y coordinates of the mousemove event relative
    // to the top-left corner of the map
    JSON.stringify(e.point) +
    '<br />' +
    // e.lngLat is the longitude, latitude geographical position of the event
    JSON.stringify(e.lngLat.wrap());
});

var marker = new mapboxgl.Marker({
    draggable: true
})
.setLngLat([16.4683766, 59.6196616])
.addTo(map);

function onDragEnd() {
    var lngLat = marker.getLngLat();
    coordinates.style.display = 'block';
    coordinates.innerHTML = '<strong>Marker coordinates:</strong> <br />' +
    'Longitude: ' + lngLat.lng + '<br />Latitude: ' + lngLat.lat;
}
marker.on('dragend', onDragEnd);

// var marker = new mapboxgl.Marker()
// .setLngLat([16.4683766, 59.6196616])
// .setPopup(new mapboxgl.Popup().setHTML("<h1>Västerås</h1> <p>En otroligt vacker stad... </p>"))
// .addTo(map);

// var marker = new mapboxgl.Marker()
// .setLngLat([18.0710935, 59.3251172])
// .setPopup(new mapboxgl.Popup().setHTML("<h1>Stockholm</h1> <p>En inte lika vacker stad... </p>"))
// .addTo(map);


// Custom markers
var geojson = {
    'type': 'FeatureCollection',
    'features': [
        {
            'type': 'Feature',
            'properties': {
                'message': 'Cat 1',
                'iconSize': [60, 60]
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [17.6387436, 59.8586126]
            }
        },
        {
            'type': 'Feature',
            'properties': {
                'message': 'Cat 2',
                'iconSize': [50, 50]
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [16.5051474, 59.3717379]
            }
        },
        {
            'type': 'Feature',
            'properties': {
                'message': 'Cat 3',
                'iconSize': [40, 40]
            },
            'geometry': {
                'type': 'Point',
                'coordinates': [15.2151181, 59.2747287]
            }
        }
    ]
};


// add markers to map
geojson.features.forEach(function (marker) {
    // create a DOM element for the marker
    var el = document.createElement('div');
    el.className = 'marker';
    el.style.backgroundImage = 'url(https://placekitten.com/g/' + marker.properties.iconSize.join('/') + '/)';
    el.style.width = marker.properties.iconSize[0] + 'px';
    el.style.height = marker.properties.iconSize[1] + 'px';

    el.addEventListener('click', function () {
        // window.alert(marker.properties.message);
    });

    // add marker to map
    new mapboxgl.Marker(el)
    .setLngLat(marker.geometry.coordinates)
    .setPopup(new mapboxgl.Popup().setHTML("<h1>Stad namn</h1> <p>En otroligt vacker stad... </p>"))
    .addTo(map);
});


// | Distance START |
var distanceContainer = document.getElementById('distance');

// GeoJSON object to hold our measurement features
var geojson = {
    'type': 'FeatureCollection',
    'features': []
};
// Used to draw a line between points
var linestring = {
    'type': 'Feature',
    'geometry': {
        'type': 'LineString',
        'coordinates': []
    }
};

map.on('load', function () {
    map.addSource('geojson', {
        'type': 'geojson',
        'data': geojson
    });

    // Add styles to the map
    map.addLayer({
        id: 'measure-points',
        type: 'circle',
        source: 'geojson',
        paint: {
            'circle-radius': 5,
            'circle-color': '#000'
        },
        filter: ['in', '$type', 'Point']
    });
    map.addLayer({
        id: 'measure-lines',
        type: 'line',
        source: 'geojson',
        layout: {
            'line-cap': 'round',
            'line-join': 'round'
        },
        paint: {
            'line-color': '#fff',
            'line-width': 2.5
        },
        filter: ['in', '$type', 'LineString']
    });

    map.on('click', function (e) {
        var features = map.queryRenderedFeatures(e.point, {
            layers: ['measure-points']
    });

    // Remove the linestring from the group
    // So we can redraw it based on the points collection
    if (geojson.features.length > 1) geojson.features.pop();

    // Clear the Distance container to populate it with a new value
    distanceContainer.innerHTML = '';

    // If a feature was clicked, remove it from the map
    if (features.length) {
        var id = features[0].properties.id;
        geojson.features = geojson.features.filter(function (point) {
            return point.properties.id !== id;
        });
    } else {
        var point = {
        'type': 'Feature',
        'geometry': {
            'type': 'Point',
            'coordinates': [e.lngLat.lng, e.lngLat.lat]
        },
        'properties': {
            'id': String(new Date().getTime())
        }
    };

    geojson.features.push(point);
    }

    if (geojson.features.length > 1) {
        linestring.geometry.coordinates = geojson.features.map(function (point) {
            return point.geometry.coordinates;
        });

        geojson.features.push(linestring);

        // Populate the distanceContainer with total distance
        var value = document.createElement('pre');
        value.textContent = 'Total distance: ' + turf.length(linestring).toLocaleString() + 'km';
        distanceContainer.appendChild(value);
    }

    map.getSource('geojson').setData(geojson);
    });
});

map.on('mousemove', function (e) {
var features = map.queryRenderedFeatures(e.point, {
layers: ['measure-points']
});
// UI indicator for clicking/hovering a point on the map
map.getCanvas().style.cursor = features.length
? 'pointer'
: 'crosshair';
});



// /**
// * An event listener is added to listen to tap events on the map.
// * Clicking on the map displays an alert box containing the latitude and longitude
// * of the location pressed.
// * @param  {H.Map} map      A HERE Map instance within the application
// */
// function setUpClickListener(map) {
//     // Attach an event listener to map display
//     // obtain the coordinates and display in an alert box.
//     map.addEventListener('tap', function (evt) {
//         var coord = map.screenToGeo(evt.currentPointer.viewportX,
//             evt.currentPointer.viewportY);
//         logEvent('Clicked at ' + Math.abs(coord.lat.toFixed(4)) +
//         ((coord.lat > 0) ? 'N' : 'S') +
//         ' ' + Math.abs(coord.lng.toFixed(4)) +
//         ((coord.lng > 0) ? 'E' : 'W'));
//         });
//         console.log(coord.lat + coord.lng)
//     }



//     // Step 4: create custom logging facilities
//     var logContainer = document.createElement('ul');
//     logContainer.className ='log';
//     logContainer.innerHTML = '<li class="log-entry">Try clicking on the map</li>';
//     map.getElement().appendChild(logContainer);



//     // Helper for logging events
//     function logEvent(str) {
//             var entry = document.createElement('li');
//             entry.className = 'log-entry';
//             entry.textContent = str;
//             logContainer.insertBefore(entry, logContainer.firstChild);
//     }


//     setUpClickListener(map);