// Signalement d'un problème sur les données, localisé au point cliqué.
import { submitProblem } from './api.js';
import { placeMarker } from './map.js';
import { toast } from './ui.js';
import { fmtLngLat } from './utils.js';

let reportLngLat = null;

export function openReport(lngLat) {
  reportLngLat = lngLat;
  const dialog = document.getElementById('reportDialog');
  dialog.querySelector('#reportCoords').textContent = fmtLngLat(lngLat, 5);
  dialog.showModal();
}

export function initReport() {
  const dialog = document.getElementById('reportDialog');
  const form = dialog.querySelector('form');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fields = new FormData(form);
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      await submitProblem({
        description: fields.get('description'),
        contact_nom: fields.get('nom'),
        institution: fields.get('institution'),
        contact_mail: fields.get('mail'),
        longitude: reportLngLat[0],
        latitude: reportLngLat[1],
      });
      placeMarker('reporting', reportLngLat);
      form.reset();
      dialog.close();
      toast('Merci ! Votre signalement a bien été envoyé.', 'success');
    } catch (error) {
      toast(`Le signalement n'a pas pu être envoyé : ${error.message}`, 'error');
    } finally {
      submit.disabled = false;
    }
  });
}
