let sameIsochrone = false;

function compute() {

    let depart = document.getElementById('inputStart').value;
    let arrivee = document.getElementById('inputEnd').value;

    // let [coordy_depart, coordx_depart] = depart.split(',').map(Number);
    // let [coordy_arrivee, coordx_arrivee] = arrivee.split(',').map(Number);

    if(zoneconstraintMarker == null) {
        fetchShortestPath(coordx_depart, coordy_depart, coordx_arrivee, coordy_arrivee);
    }else{
        console.log(zoneconstraintMarker)
        // let [coordx_constraint, coordy_constraint] = zoneconstraintMarker.getLatLng();
        var centre = zoneconstraintMarker.getLatLng();
        var coordy_constraint = centre.lat;
        var coordx_constraint = centre.lng;
        let radius = zoneconstraintMarker.getRadius();
        console.log(coordx_constraint + ' ' + coordy_constraint + ' ' + radius)
        fetchShortestPathWithContraint(coordx_depart, coordy_depart, coordx_arrivee, coordy_arrivee, coordx_constraint.toFixed(6), coordy_constraint.toFixed(6), radius)
    }
}

async function fetchShortestPath(coordx_depart, coordy_depart, coordx_arrivee, coordy_arrivee) {
    // const url = `http://localhost:5000/shortest-path?coordx_depart=${coordx_depart}&coordy_depart=${coordy_depart}&coordx_arrivee=${coordx_arrivee}&coordy_arrivee=${coordy_arrivee}`;
    const url = 'https://api.ptm.huma-num.fr/cassinet/search/route/?coordx_depart='+coordx_depart+'&coordy_depart='+coordy_depart+'&coordx_arrivee='+coordx_arrivee+'&coordy_arrivee='+coordy_arrivee
    // console.log(url)
    
    try{

        //waiting animation on map
        map.fire('dataloading');

        const response = await fetch(url);
        const data = await response.json();

        let coordinates = [];
        
        if (data.features) {
            data.features.forEach(feature => {
                feature.geometry.coordinates.forEach(coord => {
                    coordinates.push(coord.join(','));
                });
            });
       

        const elevationData = await fetchElevationData(coordinates);

        ajouterGeoJSON(data, elevationData);

        afficherTempsParcours(data.temps_total);

        ajouterCarteAnalyse('Itinéraire '+villeDepart+' - ' + villeArrivee, (data.temps_total * 48) / vitesse, data.temps_total * 48, elevationData);

        }else{
            console.log("pas de chemin existante");
            alert("Le calcul ne renvoie pas de résultat. Il peut s'agir d'un problème lié au réseau. Pensez à faire un signalement si vous identifiez un problème sur les données")
        }

        map.fire('dataload');

    }catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
    }

}

async function fetchShortestPathWithContraint(coordx_depart, coordy_depart, coordx_arrivee, coordy_arrivee, coordx_constraint, coordy_constraint, radius) {
    
    const url = 'https://api.ptm.huma-num.fr/cassinet/search/route-contrainte/?coordx_depart='+coordx_depart+'&coordy_depart='+coordy_depart+'&coordx_arrivee='+coordx_arrivee+'&coordy_arrivee='+coordy_arrivee+'&coordx_constraint='+coordx_constraint+'&coordy_constraint='+coordy_constraint+'&radius='+radius
        
    try{

        //waiting animation on map
        map.fire('dataloading');

        const response = await fetch(url);
        const data = await response.json();

        // Get all geom from route
        let coordinates = [];
        data.features.forEach(feature => {
            feature.geometry.coordinates.forEach(coord => {
                coordinates.push(coord.join(','));
            });
        });

        // call api for elevation data / IGN
        const elevationData = await fetchElevationData(coordinates);

        ajouterGeoJSON(data, elevationData);

        // Display time for route
        afficherTempsParcours(data.temps_total);

        ajouterCarteAnalyse('Itinéraire (contraint) '+villeDepart+' - ' + villeArrivee, (data.temps_total * 48) / vitesse, data.temps_total * 48, elevationData);

        map.fire('dataload');

    }catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
    }

}

async function fetchElevationData(coordinates) {
    
    let lons = [];
    let lats = [];
    coordinates.forEach(coord => {
        let [lon, lat] = coord.split(',');
        lons.push(lon);
        lats.push(lat);
    });
    
    const lonParam = lons.join('|');
    const latParam = lats.join('|');
    const url = `https://wxs.ign.fr/calcul/alti/rest/elevation.json?lon=${lonParam}&lat=${latParam}&indent=true`;
    
    const response = await fetch(url);
    const data = await response.json();
    return data.elevations;
}

async function ajouterGeoJSON(data, elevationDataOut) {
    const modeAjout = document.getElementById('radioBtnNouveau').checked;

    // Remove layer if allready presente
    if (modeAjout && geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
        geoJsonLayer = null;
    }

    // Add new geojson data to the map
    if (!geoJsonLayer) {
        geoJsonLayer = L.geoJSON(data, {
            style: styleRoute,
            onEachFeature: function (feature, layer) {
                layer.on('mouseover', async function (event) {
                    const elevationDataIn = elevationDataOut;

                    let temps = data.temps_total;
                    let tempsDeParcours = (temps * 48) / vitesse;
                    let distance = temps * 48;

                    // chartid for D3js chart
                    const chartId = 'elevationChart_' + Math.random().toString(36).substr(2, 9);

                    // code for pop up content
                    const popupContent = `<h2>Itinéraire ${villeDepart} - ${villeArrivee}</h2>
                        <br>
                        <b>Temps de parcours :</b>${tempsDeParcours.toFixed(2)} jours
                        <br>
                        <b>Distance :</b>${distance.toFixed(2)} km
                        <br>
                        <br>
                        <b>Profil altimétrique :</b>
                        <div class="popup-canvas-container" id="${chartId}" style="width: 100%; height: 100px;"></div>
                        <br>
                        <button id="downloadGeoJSON">Télécharger Chemin en GeoJSON</button>
                    `;

                    // Add popup to layer
                    layer.bindPopup(popupContent, { className: 'altimetry-popup' }).openPopup();

                    // Astuce... wait for pop up being ok
                    setTimeout(() => {
                        
                        const container = d3.select(`#${chartId}`);

                        // Remove old content 
                        container.selectAll("*").remove();

                        const svgWidth = container.node().getBoundingClientRect().width;
                        const svgHeight = container.node().getBoundingClientRect().height;
                        const margin = { top: 10, right: 20, bottom: 30, left: 40 };
                        const width = svgWidth - margin.left - margin.right;
                        const height = svgHeight - margin.top - margin.bottom;

                        const svg = container.append("svg")
                            .attr("width", svgWidth)
                            .attr("height", svgHeight)
                            .append("g")
                            .attr("transform", `translate(${margin.left},${margin.top})`);

                        const x = d3.scalePoint()
                            .domain(elevationDataIn.map(point => `${point.lon}, ${point.lat}`))
                            .range([0, width]);

                        const y = d3.scaleLinear()
                            .domain([0, d3.max(elevationDataIn, d => d.z)])
                            .nice()
                            .range([height, 0]);

                        const line = d3.line()
                            .x(d => x(`${d.lon}, ${d.lat}`))
                            .y(d => y(d.z))
                            .curve(d3.curveMonotoneX);

                        svg.append("g")
                            .attr("transform", `translate(0,${height})`)
                            .call(d3.axisBottom(x).tickSize(0).tickFormat('')); // Enlever les ticks de l'axe des x

                        svg.append("g")
                            .call(d3.axisLeft(y).tickSize(-width).ticks(3))
                            .call(g => g.select(".domain").remove());

                        svg.append("path")
                            .datum(elevationDataIn)
                            .attr("fill", "none")
                            .attr("stroke", "steelblue")
                            .attr("stroke-width", 1.5)
                            .attr("d", line);

                        const focus = svg.append("g")
                            .style("display", "none");

                        focus.append("circle")
                            .attr("r", 4.5)
                            .attr("fill", "steelblue");

                        focus.append("text")
                            .attr("x", 9)
                            .attr("dy", ".35em");

                        svg.append("rect")
                            .attr("class", "overlay")
                            .attr("width", width)
                            .attr("height", height)
                            .style("fill", "none")
                            .style("pointer-events", "all")
                            .on("mouseover", () => focus.style("display", null))
                            .on("mouseout", () => focus.style("display", "none"))
                            .on("mousemove", function(event) {
                                const bisect = d3.bisector(d => d.lon).left;
                                const x0 = x.invert(d3.pointer(event, this)[0]);
                                const i = bisect(elevationDataIn, x0, 1);
                                const d0 = elevationDataIn[i - 1];
                                const d1 = elevationDataIn[i];
                                const d = x0 - d0.lon > d1.lon - x0 ? d1 : d0;
                                focus.attr("transform", `translate(${x(`${d.lon}, ${d.lat}`)},${y(d.z)})`);
                                focus.select("text").text(d.z);
                            });

                    }, 300);

                    // listener on downlod button in popup
                    layer.getPopup().getElement().querySelector('#downloadGeoJSON').addEventListener('click', (event) => {
                        event.stopPropagation(); // No propagation event

                        const filename = 'itineraire.geojson';
                        const geoJsonData = JSON.stringify(data);
                        const blob = new Blob([geoJsonData], { type: 'application/json' });

                        // temporary link
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = filename;

                        // Click link
                        link.click();

                        // Clean url
                        URL.revokeObjectURL(url);
                    });
                });
            }
        }).addTo(map);
    } else {
        geoJsonLayer.addData(data);
    }
}

function computeIsochrone() {

    let departIsochrone = document.getElementById('isochroneStart').value;
    let stepsIsochrone = document.getElementById('stepsIsochrone').value;

    let [coordy_depart, coordx_depart] = departIsochrone.split(',').map(Number);
    let steps = stepsIsochrone.replace(' ', '').split(',');

    fetchIsochrone(coordx_depart, coordy_depart, steps);

    plotIndicators();

}

async function fetchIsochrone(coordx_depart, coordy_depart, steps) {

    const urls = steps.map(step => 
        `https://api.ptm.huma-num.fr/cassinet/isochrone/?longitude=${coordx_depart}&latitude=${coordy_depart}&distance=${step}`
    );

    try {

        //waiting animation on map
        map.fire('dataloading');

        const responses = await Promise.all(urls.map(url => fetch(url)));
        const allData = await Promise.all(responses.map(response => response.json()));

        let sameIsochrone = false;
        const allIndicators = [];
        for (let index = 0; index < allData.length; index++) {
            const data = allData[index];
            ajouterGeoJSONIsochrone(data, sameIsochrone);
            const indicators = calculateIndicators(data);
            allIndicators.push(indicators[0]);
            sameIsochrone = true;
        }
        ajouterCarteAnalyseIsochrone('Isochrone ['+coordx_depart+','+coordy_depart+']', allIndicators);

        map.fire('dataload');

    } catch (error) {
        console.error('Erreur lors de la récupération des données:', error);
    }
}

function ajouterGeoJSONIsochrone(data, sameIsochrone) {
    const modeAjout = document.getElementById('radioBtnISoNouveau').checked;

    if (modeAjout && geoJsonLayerIso && !sameIsochrone) {
        map.removeLayer(geoJsonLayerIso);
        // layerControl.removeLayer(geoJsonLayer)
        geoJsonLayerIso = null;
    }

    // new geojson data to the map
    if (!geoJsonLayerIso) {
        geoJsonLayerIso = L.geoJSON(
                data,
                {style:styleIsochrone}
            ).addTo(map);
        // layerControl.addOverlay(geoJsonLayer)
    } else {
        geoJsonLayerIso.addData(data);
    }
}

// Compute circularity indocator
function calculateIndicators(geoJsonData) {
    if (!geoJsonData || geoJsonData.type !== 'Polygon' || !geoJsonData.coordinates) {
        console.error('Données GeoJSON invalides:', geoJsonData);
        return [];
    }

    const polygon = turf.polygon(geoJsonData.coordinates);
    const area = turf.area(polygon);
    const perimeter = turf.length(polygon, { units: 'meters' });
    const circularity = (4 * Math.PI * area) / (Math.pow(perimeter, 2));
    
    return [{
        area: area,
        perimeter: perimeter,
        circularity: circularity
    }];
}

// Store indicators
const indicatorsStore = [];

function storeIndicators(indicators) {
    indicatorsStore.push(...indicators);
}

// for debug...
function plotIndicators() {
    console.log(indicatorsStore);
}