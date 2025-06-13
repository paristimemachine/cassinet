var animatedPaths = [];
let animate = true;
const segmentDelay = 5;
let colorIndex = 0;

const colors = ['#11ff22', '#ff1122', '#1122ff', '#ffff33', '#ff44ff', '#55ffff'];

var geojsonUrls = [
    'data/Brest_StOmer.geojson',
    'data/Clermont_Bayonne.geojson',
    'data/Lyon_Bordeaux.geojson',
    'data/Marseille_Nantes.geojson',
    'data/Orleans_Strasbourg.geojson',
    'data/Paris_Toulouse.geojson',
];

function invertCoordinates(coordinates) {
    if (Array.isArray(coordinates[0])) {
        return coordinates.map(coord => invertCoordinates(coord));
    } else {
        return [coordinates[1], coordinates[0]];
    }
}

function reorderSegments(segments) {
    if (segments.length <= 1) return segments;
    
    let orderedSegments = [segments[0]];
    segments.splice(0, 1);
    
    while (segments.length > 0) {
        let lastPoint = orderedSegments[orderedSegments.length - 1][1];
        for (let i = 0; i < segments.length; i++) {
            if (segments[i][0][0] === lastPoint[0] && segments[i][0][1] === lastPoint[1]) {
                orderedSegments.push(segments[i]);
                segments.splice(i, 1);
                break;
            }
        }
    }
    
    return orderedSegments;
}

async function animatePath(path, color) {
    var lineSegments = [];
    for (let i = 0; i < path.length - 1; i++) {
        if (!animate) break;

        let segment = [path[i], path[i + 1]];
        lineSegments.push(segment);

        var line = L.polyline(segment, {
            className: 'glow-path',
            color: color,
            weight: 2,
            opacity: 0.7,
            lineCap: 'round',
            dashArray: '5, 10'
        }).addTo(map);

        animatedPaths.push(line);

        await new Promise(resolve => setTimeout(resolve, segmentDelay));
    }
}

async function applyGlow(path) {
    if (animate) {
        var invertedPath = invertCoordinates(path);
        var color = colors[colorIndex % colors.length];
        await animatePath(invertedPath, color);
    }
}

function stopAllAnimations() {
    animate = false;
    stopAnimations();
}

function stopAnimations() {
    animatedPaths.forEach(function(path) {
        map.removeLayer(path);
    });
    animatedPaths = [];
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

async function loadAndAnimateGeoJSON(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        stopAnimations();
        for (const feature of data.features) {
            if (feature.geometry.type === "MultiLineString") {
                let segments = [];
                for (const path of feature.geometry.coordinates) {
                    segments.push(...path);
                }
                let orderedPath = reorderSegments(segments);
                await applyGlow(orderedPath);
                if (!animate) break;
            } else {
                await applyGlow(feature.geometry.coordinates);
                if (!animate) break;
            }
        }
    } catch (error) {
        console.error('Error loading GeoJSON:', error);
    }
}

async function loadAndAnimateAllGeoJSON(urls) {
    while (animate) {
        shuffleArray(urls);
        for (const url of urls) {
            await loadAndAnimateGeoJSON(url);
            if (!animate) break;
            colorIndex++;
        }
    }
}

// loadAndAnimateAllGeoJSON(geojsonUrls);