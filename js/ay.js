// Création de la couche pour le personnage
const personnageLayer = L.layerGroup();
personnageLayer.addTo(map); // ou ne pas l'ajouter tout de suite pour qu'elle soit désactivée par défaut

// Exemple d'icône sprite
const personnageIcon = L.icon({
    iconUrl: 'img/ay/ay_anim3.gif',
    iconSize: [48, 48], // réduit ici
    iconAnchor: [12, 24]
  });

// Position initiale fictive (à remplacer par position calculée)
let currentPosition = L.latLng(50.957562, 1.846303); // Paris par exemple

// Marqueur animé du personnage
const personnageMarker = L.marker(currentPosition, { icon: personnageIcon });
personnageLayer.addLayer(personnageMarker);

// Contrôle de couches
const overlayMaps = {
  "Voyage d'Arthur Jung": personnageLayer
};
layerControl.addOverlay(personnageLayer, "Voyage d'Arthur Jung - 1787");

personnageMarker.bindPopup(
    "<div class='arthur-young-popup'>" +
        "<div>" +
            "<img src='https://upload.wikimedia.org/wikipedia/commons/1/1b/Arthur_Young_%281741-1820%29.jpg' alt='Arthur Young'>" +
        "</div>" +
        "<div>" +
            "<a href='https://fr.wikipedia.org/wiki/Arthur_Young' target='_blank'>En savoir plus sur Arthur Young</a>" +
        "</div>" +
        "<div>" +
            "<strong>Arthur Young</strong>, partira le 15 mai de Calais.<br>" +
            "<a href='https://gallica.bnf.fr/ark:/12148/bpt6k1192719/f85.item.texteImage' target='_blank'>Source Gallica</a><br>" +
        "</div>" +
    "</div>",
    { maxWidth: 600, className: 'arthur-young-popup-wrapper' } // Classe spécifique pour le wrapper
);

// Add custom CSS to adjust the popup size using .leaflet-popup-pane
const style = document.createElement('style');
style.innerHTML = `
    .leaflet-popup-pane .custom-popup .leaflet-pane{
        max-width: 560px !important; /* Adjust the max width */;
        width: 600px;
    }
`;
document.head.appendChild(style);

let isMouseOverPopup = false;

personnageMarker.on('mouseover', function (e) {
    this.openPopup();
});

// personnageMarker.on('mouseout', function (e) {
//     setTimeout(() => {
//         if (!isMouseOverPopup) {
//             this.closePopup();
//         }
//     }, 2000); // Laisser la popup ouverte pendant 2 secondes avant de la fermer
// });

map.on('popupopen', function (e) {
    const popupElement = e.popup.getElement();
    popupElement.addEventListener('mouseenter', function () {
        isMouseOverPopup = true;
    });
    popupElement.addEventListener('mouseleave', function () {
        isMouseOverPopup = false;
        setTimeout(() => {
            if (!isMouseOverPopup) {
                e.popup._source.closePopup();
            }
        }, 20000);
    });
});

function chargerTrajetArthur(csvUrl) {
    Papa.parse(csvUrl, {
        download: true,
        header: true,
        complete: function(results) {
            const data = results.data;
            // console.log(data);
            const today = new Date();
            const todayString = today.toISOString().split('T')[0].slice(5); // Format MM-DD
            // console.log(todayString);

            // Create a polyline for the journey
            let journeyLine = null;
            
            const ligneDuJour = data.find(row => {
                const rowDate = row.date && row.date.trim();
                const currentHour = today.getHours();
                
                // Calculate which segment of the journey we should be on
                // For a journey from 8h to 20h (12 hours), divide into segments
                let progressIndex = 0;
                
                if (currentHour >= 8 && currentHour <= 20) {
                    // Calculate progress (0 to 1) through the day's journey
                    const dayProgress = (currentHour - 8) / 12;
                    
                    // Count how many entries we have for today's date
                    const todayEntries = data.filter(r => 
                        r.date && r.date.trim().slice(5) === todayString
                    );
                    
                    if (todayEntries.length > 0) {
                        // Calculate which entry to show based on time of day
                        progressIndex = Math.min(
                            Math.floor(dayProgress * todayEntries.length),
                            todayEntries.length - 1
                        );
                        
                        // If this isn't the row we want, skip it
                        const allMatchingRows = data.filter(r => 
                            r.date && r.date.trim().slice(5) === todayString
                        );
                        
                        if (allMatchingRows.indexOf(row) !== progressIndex) {
                            return false;
                        }
                    }
                }
                console.log(row.fid + ' ' + todayString + ' ' + rowDate );
                return rowDate && rowDate.slice(5) === todayString;
            });

            // console.log(data)
            console.log(ligneDuJour);

            console.log(todayString);

            if (ligneDuJour) {
                const origine = ligneDuJour.origin;
                const destination = ligneDuJour.destination;
                const texte = ligneDuJour.text;
                const url = ligneDuJour.url;
                const file = 'data/img/'+ligneDuJour.file

                const dayMonth = todayString.replace('-', '/').split('/').reverse().join('/');
                const date = `${dayMonth.replace('/', '/')}/1787`;

                // ⚠️ À remplacer par une recherche XY via graphe Cassini plus tard

                const position = L.latLng(parseFloat(ligneDuJour.y_start), parseFloat(ligneDuJour.x_start));
                personnageMarker.setLatLng(position);

                // Draw journey line for all dates up to current date
                // Sort data by date to ensure chronological path
                const sortedData = [...data].sort((a, b) => {
                    if (!a.date || !b.date) return 0;
                    return new Date(a.date) - new Date(b.date);
                });
                
                // Get all points up to today (including today)
                const journeyPoints = [];
                let reachedToday = false;
                
                // Use a Set to track added points and avoid duplicates
                const addedPointKeys = new Set();
                const todaySegments = sortedData.filter(row => 
                    row.date && row.date.trim().slice(5) === todayString
                );
                
                for (const point of sortedData) {
                    if (!point.date) continue;
                    
                    const pointDate = point.date.trim();
                    const datePart = pointDate.slice(5);
                    
                    // Check if this date is after today's date
                    if (new Date('2023-' + datePart) > new Date('2023-' + todayString)) {
                        break; // Stop processing future dates
                    }
                    
                    // Add starting point if valid
                    if (point.x_start && point.y_start) {
                        const startKey = `${point.x_start},${point.y_start}`;
                        if (!addedPointKeys.has(startKey)) {
                            journeyPoints.push(L.latLng(
                                parseFloat(point.y_start),
                                parseFloat(point.x_start)
                            ));
                            addedPointKeys.add(startKey);
                        }
                    }
                    
                    // Add ending point if valid
                    if (point.x_end && point.y_end) {
                        const endKey = `${point.x_end},${point.y_end}`;
                        if (!addedPointKeys.has(endKey)) {
                            journeyPoints.push(L.latLng(
                                parseFloat(point.y_end),
                                parseFloat(point.x_end)
                            ));
                            addedPointKeys.add(endKey);
                        }
                    }
                    
                    // Mark if we've processed all of today's segments
                    if (datePart === todayString && 
                        point === todaySegments[todaySegments.length - 1]) {
                        reachedToday = true;
                    }
                }
                
                // If there's an existing journey line, remove it first
                if (journeyLine) {
                    personnageLayer.removeLayer(journeyLine);
                }
                
                // Create the polyline if we have points
                if (journeyPoints.length > 0) {
                    journeyLine = L.polyline(journeyPoints, {
                        color: '#c83232',
                        weight: 3,
                        opacity: 0.7,
                        dashArray: '5, 8'
                    }).addTo(personnageLayer);
                }

                // Update popup
                personnageMarker.bindPopup(
                    "<div class='arthur-young-popup'>" + // Ajout d'une classe spécifique
                        "<div style='display: flex; flex-direction: column; align-items: center; font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5; max-width: 600px; word-wrap: break-word;'>" +
                            "<div style='text-align: center; margin-bottom: 10px;'>" +
                            `<img src=${file} alt='Illustration générée par IA d'après le texte' title='Illustration générée par IA' style='width: 100%; height: auto; border-radius: 4px; max-width: 300px;'>` +
                            "</div>" +
                            "<div style='text-align: center;'>" +
                            "<a href='https://fr.wikipedia.org/wiki/Arthur_Young' style='color: #007BFF; text-decoration: none;' target='_blank'>En savoir plus sur Arthur Young</a>" +
                            "</div>" +
                            "<div style='text-align: center; margin-top: 10px;'>" +
                            `<strong>${date} – ${origine} → ${destination}</strong><br>` +
                            `${texte}<br>` +
                            `<a href=${url} style='color: #007BFF; text-decoration: none;' target='_blank'>Voir sur Gallica</a><br>` +
                            "</div>" +
                        "</div>" +
                    "</div>",
                    { maxWidth: 450, className: 'arthur-young-popup-wrapper' } // Classe spécifique pour le wrapper
                );
            }
        }
    });
}

// async function getLatLngFromCity(ville) {
//     if (ligneDuJour && ligneDuJour.origin === ville && ligneDuJour.x_start && ligneDuJour.y_start) {
//         return L.latLng(parseFloat(ligneDuJour.y_start), parseFloat(ligneDuJour.x_start));
//     }
//     return L.latLng(50.957562, 1.846303); // Valeur par défaut si non trouvé
// }

// Lancement
chargerTrajetArthur('data/arthur_young_trajets2.csv');