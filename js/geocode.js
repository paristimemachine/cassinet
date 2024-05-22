var geocoder = L.Control.Geocoder.nominatim();

function geocodeInput(inputId) {
    var input = document.getElementById(inputId);
    input.addEventListener('change', function() {
        geocoder.geocode(input.value, function(results) {
            if (results.length > 0) {
                var bbox = results[0].bbox;
                var center = L.latLng(
                    (bbox[0][0] + bbox[1][0]) / 2,
                    (bbox[0][1] + bbox[1][1]) / 2
                );

                console.log(center);
                
            }
        });
    });
}

geocodeInput('inputStart');
geocodeInput('inputEnd');