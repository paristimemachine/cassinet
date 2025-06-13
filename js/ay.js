// Création de la couche pour le personnage
const personnageLayer = L.layerGroup();
personnageLayer.addTo(map); // ou ne pas l'ajouter tout de suite pour qu'elle soit désactivée par défaut

// Exemple d'icône sprite
const personnageIcon = L.icon({
    iconUrl: 'img/ay/ay_anim3.gif',
    iconSize: [48, 48], // réduit ici
    iconAnchor: [12, 24]
  });

// Icône pour les étapes passées
const etapeIcon = L.divIcon({
    // html: '<svg viewbox="0 0 12 12" width="8px" height="8px" fill="#c83232" stroke="white" stroke-width="1.5"><circle cx="12" cy="12" r="10"/></svg>',
    html: '<svg viewBox="0 0 6 6" width="8px" height="6px" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="1.5" width="9" height="9" fill="#c83232" stroke="white" stroke-width="0.5" rx="1.5" ry="1.5"/></svg>',
    className: 'etape-marker-icon', // Classe CSS optionnelle pour stylisation
    iconSize: [8, 8],
    iconAnchor: [4, 4] // Centre de l'icône
});

// Position initiale fictive (à remplacer par position calculée)
let currentPosition = L.latLng(50.957562, 1.846303); // Paris par exemple

// Marqueur animé du personnage
const personnageMarker = L.marker(currentPosition, { icon: personnageIcon });
personnageLayer.addLayer(personnageMarker);

// Variable pour stocker les marqueurs des étapes passées
let etapeMarkers = [];

// Fonction pour générer le contenu HTML de la popup d'Arthur Young
function genererContenuPopupArthur(dataRow) {
    const file = 'data/img/' + dataRow.file;
    // Assurer que dataRow.date est bien au format YYYY-MM-DD
    const dateParts = dataRow.date.trim().split('-'); 
    const displayDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`; // Format DD/MM/YYYY

    return "<div class='arthur-young-popup'>" +
        "<div style='display: flex; flex-direction: column; align-items: center; font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.5; max-width: 600px; word-wrap: break-word;'>" +
            "<div style='text-align: center; margin-bottom: 10px;'>" +
            `<img src='${file}' alt='Illustration pour ${dataRow.origin} - ${dataRow.destination}' title='Illustration générée par IA : ${dataRow.text}' style='width: 100%; height: auto; border-radius: 4px; max-width: 300px;'>` +
            "</div>" +
            "<div style='text-align: center;'>" +
            "<a href='https://fr.wikipedia.org/wiki/Arthur_Young' style='color: #007BFF; text-decoration: none;' target='_blank'>En savoir plus sur Arthur Young</a>" +
            "</div>" +
            "<div style='text-align: center; margin-top: 10px;'>" +
            `<strong>${displayDate} – ${dataRow.origin} → ${dataRow.destination}</strong><br>` +
            `${dataRow.text}<br>` +
            `<a href='${dataRow.url}' style='color: #007BFF; text-decoration: none;' target='_blank'>Voir sur Gallica</a><br>` +
            "</div>" +
        "</div>" +
    "</div>";
}

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
    .etape-marker-icon svg { /* Style pour l'icône SVG si nécessaire */
        display: block; /* Assure que l'icône est bien rendue */
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
        // Augmentation du délai pour permettre la lecture
        setTimeout(() => {
            if (!isMouseOverPopup && e.popup && e.popup._source && e.popup._source.closePopup) {
                e.popup._source.closePopup();
            }
        }, 2000); // Délai de fermeture après que la souris quitte la popup
    });
});

function chargerTrajetArthur(csvUrl) {
    // Ajout de la variable pour suivre la polyline entre les traitements
    let journeyLine = null;

    // Suppression des anciens marqueurs d'étape avant de charger les nouveaux
    etapeMarkers.forEach(marker => personnageLayer.removeLayer(marker));
    etapeMarkers = [];

    Papa.parse(csvUrl, {
        download: true,
        header: true,
        complete: function(results) {
            const data = results.data;
            // console.log(data);

            const today = new Date();
            const todayString = today.toISOString().split('T')[0].slice(5); // Format MM-DD
            const currentHour = today.getHours();

            // Filtrer et trier les lignes du jour par 'ordre'
            const todayRows = data
                .filter(r => r.date && r.date.trim().slice(5) === todayString)
                .sort((a, b) => parseInt(a.ordre, 10) - parseInt(b.ordre, 10));

            let ligneDuJour = null;
            if (todayRows.length > 0) {
                let index;
                if (currentHour < 8) {
                    index = 0;
                } else if (currentHour > 20) {
                    index = todayRows.length - 1;
                } else {
                    const dayProgress = (currentHour - 8) / 12;
                    index = Math.min(Math.floor(dayProgress * todayRows.length), todayRows.length - 1);
                }
                ligneDuJour = todayRows[index];
            }

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

                const position = L.latLng(parseFloat(ligneDuJour.y_end), parseFloat(ligneDuJour.x_end));
                personnageMarker.setLatLng(position);

                // Draw journey line for all dates up to current date
                // Sort data by date and then by order to ensure chronological path
                const sortedData = [...data].sort((a, b) => {
                    if (!a.date || !b.date) return 0;
                    const dateA = new Date(a.date.trim());
                    const dateB = new Date(b.date.trim());
                    if (dateA < dateB) return -1;
                    if (dateA > dateB) return 1;
                    // Dates are equal, sort by 'ordre'
                    return parseInt(a.ordre, 10) - parseInt(b.ordre, 10);
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
                    if (new Date('2025-' + datePart) > new Date('2025-' + todayString)) {
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
                
                // Suppression éventuelle de l’ancienne ligne
                if (journeyLine) {
                    personnageLayer.removeLayer(journeyLine);
                }
                
                // Création de la nouvelle ligne
                if (journeyPoints.length > 0) {
                    journeyLine = L.polyline(journeyPoints, {
                        color: '#333333',
                        weight: 2,
                        opacity: 0.8,
                        dashArray: '4'
                    }).addTo(personnageLayer);
                }

                // Update popup for the main character marker
                personnageMarker.bindPopup(
                    genererContenuPopupArthur(ligneDuJour),
                    { maxWidth: 400, className: 'arthur-young-popup-wrapper' }
                );

                // Add markers for previous steps
                const etapesPrecedentes = [];
                for (const point of sortedData) {
                    if (!point.date || !point.x_end || !point.y_end) continue;

                    // Compare based on the object itself after sorting
                    // ligneDuJour is an object from 'data' (via todayRows)
                    // point is an object from 'data' (via sortedData)
                    // Direct object comparison (point === ligneDuJour) should work if they are references to the same object in memory.
                    // To be safer, compare unique identifiers if available, or key properties like date and ordre.
                    const isLigneDuJour = (point.date === ligneDuJour.date && point.ordre === ligneDuJour.ordre);

                    if (isLigneDuJour) {
                        break; // Reached the current segment, stop collecting previous steps
                    }
                    etapesPrecedentes.push(point);
                }

                for (const etape of etapesPrecedentes) {
                    if (etape.x_end && etape.y_end) { // Ensure coordinates are valid
                        const etapePos = L.latLng(parseFloat(etape.y_end), parseFloat(etape.x_end));
                        const etapeMarker = L.marker(etapePos, { icon: etapeIcon });

                        etapeMarker.bindPopup(
                            genererContenuPopupArthur(etape),
                            { maxWidth: 450, className: 'arthur-young-popup-wrapper' }
                        );

                        etapeMarker.on('mouseover', function () {
                            this.openPopup();
                        });
                        // mouseout is handled by the global map.on('popupopen') logic

                        personnageLayer.addLayer(etapeMarker);
                        etapeMarkers.push(etapeMarker);
                    }
                }
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
chargerTrajetArthur('data/arthur_young_trajet_v3.csv');