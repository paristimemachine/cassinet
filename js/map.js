//map init
let map = L.map('map', {
  center: [46.9, 1.8],
  zoom: 7,
  measureControl: true
});

let scale = L.control.scale({imperial:false}).addTo(map);

let departMarker = null;
let arriveeMarker = null;
let isochroneMarker = null;
let zoneconstraintMarker = null;
let reportingMarker = null;

//lat, long click
let lat = 0;
let lng = 0;

//coordonnées départ / arrivée
let [coordy_depart, coordx_depart] = [0,0];
let [coordy_arrivee, coordx_arrivee] = [0,0];

let villeDepart = '';
let villeArrivee = '';
let villeDepartIsochrone = '';

let greenIcon = new L.Icon({
  iconUrl: 'img/GreenPoint.svg',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  // popupAnchor: [1, -34],
});

let redIcon = new L.Icon({
  iconUrl: 'img/RedPoint.svg',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  // popupAnchor: [1, -34],
});

let orangeIcon = new L.Icon({
  iconUrl: 'img/OrangePoint.svg',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  // popupAnchor: [1, -34],
});

let blueIcon = new L.Icon({
  iconUrl: 'img/BluePoint.svg',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  // popupAnchor: [1, -34],
});

let yellowIcon = new L.Icon({
  iconUrl: 'img/YellowPoint.svg',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
  // popupAnchor: [1, -34],
});

var styleRoute = {
  "color": "#1111ff",
  "weight": 2,
  "opacity": 1
};

var styleIsochrone = {
  "color": "#0000ff",
  "weight": 1,
  "opacity": 0.25
};

let geoJsonLayer  = {}
let geoJsonLayerIso = {}
let data;

let osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
  })

let sogefiCassiniLayer = L.tileLayer.wms('https://ws.sogefi-web.com/wms?', {
    layers: 'Carte_Cassini',
    attribution : 'EHESS/IGN/SOGEFI',
    maxZoom: 21,
    format: 'image/png',
    transparent: true
  });

let carteCapitaine = L.tileLayer.wms('https://ws.sogefi-web.com/wms?', {
  layers: 'Carte_Capitaine',
  attribution : 'SOGEFI',
  maxZoom: 21,
  format: 'image/png',
  transparent: true
});

let carteCassiniEHESSGhdb = L.tileLayer.wms('https://geohistoricaldata.org/geoserver/cassini-ehess/CASSINI/wms?', {
  layers: 'CASSINI',
  attribution : 'EHESS / GeoHistoricalData',
  maxZoom: 21,
  format: 'image/png',
  transparent: true
}).addTo(map);

let tachesUrbaines = L.vectorGrid
  .protobuf('https://api.ptm.huma-num.fr/martin/taches_urbaines/{z}/{x}/{y}', {
  vectorTileLayerStyles: {
    'taches_urbaines': function(properties, zoom) {
      return {
        fillColor: '#ee0000',
        fillOpacity: 0.7,
        //fillOpacity: 1,
        stroke: true,
        fill: true,
        color: 'black',
          //opacity: 0.2,
        weight: 0,
      }
    }
  }
});

let ignCurrentLayer = L.tileLayer(
  "https://data.geopf.fr/wmts?" +
  "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
  "&STYLE=normal" +
  "&TILEMATRIXSET=PM" +
  "&FORMAT=image/png" +
  "&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2" +
  "&TILEMATRIX={z}" +
  "&TILEROW={y}" +
  "&TILECOL={x}",
  {
      attribution: "IGN-F/Geoportail",
      minNativeZoom: 0,
      maxNativeZoom: 19,
      minZoom: 0,
      maxZoom: 21,
      tileSize: 256
  }
);

let ignEtatMajorLayer = L.tileLayer(
  "https://data.geopf.fr/wmts?" +
  "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
  "&STYLE=normal" +
  "&TILEMATRIXSET=PM" +
  "&FORMAT=image/jpeg" +
  "&LAYER=GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40" +
  "&TILEMATRIX={z}" +
  "&TILEROW={y}" +
  "&TILECOL={x}",
  {
      attribution: "IGN-F/Geoportail",
      minNativeZoom: 6,
      maxNativeZoom: 15,
      minZoom: 0,
      maxZoom: 21,
      tileSize: 256
  }
);

let ignOrthoLayer = L.tileLayer(
  "https://data.geopf.fr/wmts?" +
  "&REQUEST=GetTile&SERVICE=WMTS&VERSION=1.0.0" +
  "&STYLE=normal" +
  "&TILEMATRIXSET=PM" +
  "&FORMAT=image/jpeg" +
  "&LAYER=ORTHOIMAGERY.ORTHOPHOTOS" +
  "&TILEMATRIX={z}" +
  "&TILEROW={y}" +
  "&TILECOL={x}",
  {
      attribution: "IGN-F/Geoportail",
      minNativeZoom: 0,
      maxNativeZoom: 19,
      minZoom: 0,
      maxZoom: 21,
      tileSize: 256
  }
).addTo(map);

let baseLayers = {
    "OSM" : osm,
    "IGN Plan actuel" : ignCurrentLayer,
    "IGN Orthophotographie" : ignOrthoLayer,
    "Carte d'Etat Major" : ignEtatMajorLayer,
    "Carte de Cassini N&B" : sogefiCassiniLayer,
    "Carte de Cassini Couleur" :carteCassiniEHESSGhdb,
    "Carte de Capitaine" :carteCapitaine,
};

let reseauCassini = L.vectorGrid
.protobuf('https://api.ptm.huma-num.fr/martin/france_cassini_edge/{z}/{x}/{y}', {
vectorTileLayerStyles: {
  'france_cassini_edge': function(properties, zoom) {
    let type = properties.road_type
    return {
      color:  type === 'rouge' ? '#bb2211' :
              type === 'blanc' ? '#010101' : '#111111',
      opacity: 0.5,
      weight:1,
    }
  }
}
});

let overlays = {
  "Tâches urbaines" : tachesUrbaines,
  "Réseau Cassini" : reseauCassini,
};

let layerControl = L.control.layers(baseLayers, overlays).addTo(map);

map.on('baselayerchange', function(event) {
   let selectedBaseLayer = event.layer;

   if (selectedBaseLayer !== ignOrthoLayer | selectedBaseLayer !== ignCurrentLayer | selectedBaseLayer !== osm) {
       ignOrthoLayer.addTo(map);
   }
});

//unpkg broked
L.Control.geocoder().addTo(map);

var loadingControl = L.Control.loading({
  separate: true
});
map.addControl(loadingControl);

map.on('click', async function(e) {
  let latlng = e.latlng;
  lat = latlng.lat;
  lng = latlng.lng;

  // Format coord to 6 digits
  let coordsText = `Latitude: ${lat.toFixed(6)}, Longitude: ${lng.toFixed(6)}`;

  const response = await fetch('https://api.ptm.huma-num.fr/cassinet/cherche_tache_urbaine/?longitude='+lng+'&latitude='+lat)
  if (!response.ok) {
    throw new Error('La réponse du serveur n\'est pas OK');
  }
  const data = await response.json();
  // console.log(data);

  let tacheUrbaineProche = data[0]['nom'];

  // Main pop up on map 
  let popupContent = `
      <div><h1><b>Tâche urbaine la plus proche :<br> ${tacheUrbaineProche} à ${data[0]['distance'].toFixed(1)} (m)</b></h1><br>
      <h3><b>${coordsText}</b></h3></div>
      <br>
      <button id='buttonModalStart' onclick="setCoords('depart', ${lat}, ${lng}, '${tacheUrbaineProche}')">Définir comme départ</button>
      <button id='buttonModalEnd' onclick="setCoords('arrivee', ${lat}, ${lng}, '${tacheUrbaineProche}')">Définir comme arrivée</button>
      <button id='buttonModalIsochrone' onclick="setCoords('departisochrone', ${lat}, ${lng}, '${tacheUrbaineProche}')">Centre Isochrone</button>
      <button id='buttonModalConstraints' onclick="setCoords('zoneconstraint', ${lat}, ${lng}, '${tacheUrbaineProche}')">Contrainte</button>
      <button id='buttonModalReporting' onclick="setCoords('reporting', ${lat}, ${lng}, '${tacheUrbaineProche}')">Signaler une erreur</button>
  `;

    let popup = L.popup({ className: 'main-map-popup' })
        .setLatLng(latlng)
        .setContent(popupContent)
        .openOn(map);
  });

  // bad name for this function...
  // traite le choix de l'utilisateur au click sur modale
  function setCoords(type, lat, lng, nomTacheUrbaineProche) {
    // format coord
    let coords = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;

    if (type === 'depart') {
      villeDepart = nomTacheUrbaineProche;
      let nomtacheDepart = villeDepart ? villeDepart : "";
      [coordy_depart, coordx_depart] = [lat, lng];
      coords = `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
      document.getElementById('inputStart').value = nomtacheDepart + ' ['+coords+']';
        if (departMarker) {
          departMarker.setLatLng([lat, lng]);
      } else {
          departMarker = L.marker([lat, lng], {icon: greenIcon}).addTo(map);
      }
    } else if (type === 'arrivee') {
        villeArrivee = nomTacheUrbaineProche;
        let nomtacheArrivee = villeArrivee ? villeArrivee : "";
        [coordy_arrivee, coordx_arrivee] = [lat, lng];
        coords = `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
        document.getElementById('inputEnd').value = nomtacheArrivee + ' ['+coords+']';
        if (arriveeMarker) {
          arriveeMarker.setLatLng([lat, lng]);
      } else {
          arriveeMarker = L.marker([lat, lng], {icon: redIcon}).addTo(map);
      }
    } else if (type === 'departisochrone') {
      document.getElementById('isochroneStart').value = coords;
      villeDepartIsochrone = nomTacheUrbaineProche;
      if (isochroneMarker) {
        isochroneMarker.setLatLng([lat, lng]);
    } else {
        isochroneMarker = L.marker([lat, lng], {icon: blueIcon}).addTo(map);
    }
    } else if (type === 'zoneconstraint') {
      let radius = document.getElementById('contrainte').value;
      if (zoneconstraintMarker) {
        zoneconstraintMarker.setLatLng([lat, lng]);
        zoneconstraintMarker.setRadius(radius*1000);
    } else {
      zoneconstraintMarker = L.circle([lat,lng], radius*1000).addTo(map);
      zoneconstraintMarker.setStyle({color: 'black'});
      zoneconstraintMarker.on('click', function() {
        map.removeLayer(zoneconstraintMarker);
        zoneconstraintMarker = null;
      });
    }
    }  else if (type === 'reporting') {
      document.getElementById('inputStart').value = coords;
      
      openModal();
    }

    map.closePopup();
}
  