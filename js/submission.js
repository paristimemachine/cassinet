function submitProblem() {
    var description = document.getElementById('problemDescription').value;
    var contactNom = document.getElementById('contactNom').value;
    var institution = document.getElementById('contactInstitution').value;
    var contactMail = document.getElementById('contactMail').value;

    var formData = {
        description: description,
        contact_nom: contactNom,
        institution: institution,
        contact_mail: contactMail,
        latitude: lat,
        longitude: lng
    };

    fetch('https://api.ptm.huma-num.fr/cassinet/submit_problem', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        if (response.ok) {
            alert('Problème soumis avec succès!');
            closeModal();
            if (reportingMarker) {
                reportingMarker.setLatLng([lat, lng]);
            } else {
              reportingMarker = L.marker([lat, lng], {icon: yellowIcon}).addTo(map);
            }
            
        } else {
            throw new Error('Erreur lors de la soumission du problème.');
        }
    })
    .catch(error => {
        console.error('Erreur:', error);
        alert('Une erreur s\'est produite lors de la soumission du problème.');
    });
}