function reload(){
  window.location.reload();
}

// Get infor modale
const infoBtn = document.getElementById('infoBtn');
const modal = document.getElementById('modal');
const closeModalBtn = document.getElementById('closeModalBtn');

// Open info modale
infoBtn.addEventListener('click', () => {
  modal.classList.remove('hidden');
  mapContainer.style.display = 'none';
});

// CLose info modale
closeModalBtn.addEventListener('click', () => {
  modal.classList.add('hidden');
  mapContainer.style.display = 'block';
});

/// OPen signalement modale
function openModal() {
  var modal = document.getElementById("myModal");
  modal.style.display = "block";
}

// CLose signalement modale
function closeModal() {
  var modal = document.getElementById("myModal");
  modal.style.display = "none";
}

// button parameter
document.addEventListener("DOMContentLoaded", function() {
  const toggleParamsBtn = document.getElementById("toggleParams");
  const paramsContent = document.getElementById("paramsContent");

  toggleParamsBtn.addEventListener("click", function() {
    if (paramsContent.style.display === "none") {
      paramsContent.style.display = "block";
      toggleParamsBtn.textContent = "Réduire";
    } else {
      paramsContent.style.display = "none";
      toggleParamsBtn.textContent = "Déployer";
    }
  });
});


function afficherTempsParcours(temps) {
    let divTempsParcours = document.getElementById('tempsParcours');

    const modeCheval = document.getElementById('calculRouteCheval').checked;

    if(modeCheval){
      vitesse = Number(document.getElementById('horsespeed').value);
      
    }else{
      vitesse = Number(document.getElementById('footspeed').value);
    }

    // console.log(vitesse);
    
    // divTempsParcours.innerHTML = `<b>Temps parcours :</b> ${((temps*48)/vitesse).toFixed(2)} jours<br><b>Distance :</b> ${(temps*48).toFixed(2)} km`;
    // divTempsParcours.style.display = 'block'; // Change le style pour l'afficher
}

document.addEventListener('DOMContentLoaded', function () {
  const analysisPanel = document.getElementById('analysisPanel');
  const togglePanelButton = document.getElementById('togglePanelButton');
  const mapContainer = document.getElementById('mapContainer');

  togglePanelButton.addEventListener('click', function () {
    analysisPanel.classList.toggle('open');
    mapContainer.classList.toggle('shifted');
    togglePanelButton.classList.toggle('open');
  });
});