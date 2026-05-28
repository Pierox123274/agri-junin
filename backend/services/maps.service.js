/**
 * Proxy Google Maps — Directions y Geocoding (clave solo en servidor)
 */
const https = require('https');

const HUANCAYO_ORIGIN = '-12.06513,-75.20486';
const CENTRO = { lat: -12.06513, lng: -75.20486, etiqueta: 'Huancayo, Junín' };

const fetchJson = (url) =>
  new Promise((resolve, reject) => {
    https
      .get(url, { headers: { Accept: 'application/json' } }, (res) => {
        let body = '';
        res.on('data', (c) => {
          body += c;
        });
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });

const getApiKey = () => (process.env.GOOGLE_MAPS_API_KEY || '').trim();

const validarClaveGoogle = async (key) => {
  if (!key) return { ok: false, mensaje: 'GOOGLE_MAPS_API_KEY no configurada en backend/.env' };
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=Huancayo&key=${key}`;
  const data = await fetchJson(url);
  if (data.status === 'OK') return { ok: true };
  const msg = data.error_message || data.status || 'Clave rechazada';
  if (/expired|denied|invalid|disabled|billing/i.test(msg)) {
    return { ok: false, mensaje: `Google Maps: ${msg}. Use coordenadas manuales en el formulario.` };
  }
  return { ok: false, mensaje: `Google Maps: ${msg}` };
};

const formatDirections = (data) => {
  const leg = data.routes?.[0]?.legs?.[0];
  if (!leg) return null;
  return {
    origen: {
      lat: leg.start_location.lat,
      lng: leg.start_location.lng,
      direccion: leg.start_address,
    },
    destino: {
      lat: leg.end_location.lat,
      lng: leg.end_location.lng,
      direccion: leg.end_address,
    },
    distancia: leg.distance?.text,
    distancia_metros: leg.distance?.value,
    duracion: leg.duration?.text,
    duracion_segundos: leg.duration?.value,
    polyline: data.routes[0].overview_polyline?.points,
    bounds: data.routes[0].bounds,
  };
};

const getDirectionsToLote = async (lat, lng) => {
  const key = getApiKey();
  const check = await validarClaveGoogle(key);
  if (!check.ok) throw new Error(check.mensaje);

  const destination = `${lat},${lng}`;
  const url =
    `https://maps.googleapis.com/maps/api/directions/json?origin=${HUANCAYO_ORIGIN}` +
    `&destination=${encodeURIComponent(destination)}&mode=driving&language=es&key=${key}`;
  const data = await fetchJson(url);
  if (data.status !== 'OK') {
    throw new Error(data.error_message || `Directions: ${data.status}`);
  }
  return {
    origen_referencia: 'Huancayo, Junín',
    ...formatDirections(data),
  };
};

const reverseGeocode = async (lat, lng) => {
  const key = getApiKey();
  const check = await validarClaveGoogle(key);
  if (!check.ok) {
    return { direccion: `${lat}, ${lng}`, place_id: null };
  }
  const url =
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=es&key=${key}`;
  const data = await fetchJson(url);
  if (data.status !== 'OK' || !data.results?.length) {
    return { direccion: `${lat}, ${lng}`, place_id: null };
  }
  return {
    direccion: data.results[0].formatted_address,
    place_id: data.results[0].place_id,
  };
};

const getMapsConfig = async () => {
  const key = getApiKey();
  const check = await validarClaveGoogle(key);
  if (!check.ok) {
    return {
      apiKey: '',
      mapAvailable: false,
      mensaje: check.mensaje,
      centro: CENTRO,
      origenRuta: HUANCAYO_ORIGIN,
    };
  }
  return {
    apiKey: key,
    mapAvailable: true,
    mensaje: null,
    centro: CENTRO,
    origenRuta: HUANCAYO_ORIGIN,
  };
};

module.exports = { getDirectionsToLote, reverseGeocode, getMapsConfig, HUANCAYO_ORIGIN };
