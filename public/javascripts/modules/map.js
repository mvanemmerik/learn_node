import { $ } from './bling';
import axios from 'axios';


const mapOptions = {
  center: { lat: 39.95, lng: -86.27 },
  zoom: 14
}

function loadPlaces(map, lat = 39.95, lng = -86.27) {
  axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`)
  .then(res => {
    const places = res.data;
    if (!places.length) {
      alert('no places found.');
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    const infoWindow = new google.maps.InfoWindow();

    const markers = places.map(place => {
      const [placeLng, placeLat] = place.location.coordinates;
      const position = { lat: placeLat, lng: placeLng };
      bounds.extend(position);
      const marker = new google.maps.Marker({ map, position });
      marker.place = place;
      return marker;
    });

    markers.forEach(marker => marker.addListener('click', function() {
      const html = `
      <div class="popup">
        <a href="/store/${this.place.slug}">
          <img src="../uploads/${this.place.photo || 'store.png'}"
          alt="${this.place.name}" />
          <p>${this.place.name} - ${this.place.location.address}</p>
        </a>
      </div>
      `;
      infoWindow.setContent(html);
      infoWindow.open(map, this);
    }));
    map.setCenter(bounds.getCenter());
    map.fitBounds(bounds);
  })
}


function makeMap(mapDiv) {
  if (!mapDiv) return;
  const map = new google.maps.Map(mapDiv, mapOptions);
  loadPlaces(map);
  const input = $('[name="geolocate"]');
  const autocomplete = new google.maps.places.Autocomplete(input);

  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng());
  });
}

export default makeMap;