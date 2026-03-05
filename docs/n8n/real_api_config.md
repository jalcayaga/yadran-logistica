/**
 * GUÍA TÉCNICA: INTEGRACIÓN DE APIS REALES (MARÍTIMAS)
 * ==================================================
 */

/**
 * 1. CLIMA: STORMGLASS.IO
 * ----------------------
 * - Es la mejor API marina (usa modelos ECMWF y NOAA).
 * - **ESTRATEGIA OPTIMIZADA (PLAN FREE - 10/day):**
 *   Dividir el día en 10 slots (cada 2.4 horas) es buena idea, pero podemos ser aún más eficientes:
 * 
 *   TIP MAESTRO: Una sola llamada a Stormglass puede devolver hasta 10 días de pronóstico.
 *   - En n8n, cuando hagas el HTTP Request, guarda TODAS las horas que te devuelva la API.
 *   - Si haces 1 sola consulta a las 08:00 AM, ya tienes el pronóstico para TODO el día.
 *   - Recomendación: Haz 3-4 consultas al día (Madrugada, Mañana, Tarde, Noche) para capturar cambios de modelo.
 *   - Así te sobran 6-7 consultas para "Refresco Manual" cuando el usuario pulse el botón en el dashboard.
 * 
 * ESTRATEGIA EN n8n:
 * - Filtra por centros con actividad próxima (ahorra tokens).
 * - Consulta recomendada: 
 *   URL: https://api.stormglass.io/v2/weather/point?lat={{$json.lat}}&lng={{$json.lng}}&params=windSpeed,windGust,waveHeight,visibility
 */

/**
 * 2. PUERTOS: SITPORT (SCRAPER)
 * ----------------------------
 * - Dado que no hay API pública, usamos un scraper en n8n.
 * 
 * PASOS EN n8n:
 * 1. HTTP Request: GET https://sitport.directemar.cl/
 * 2. HTML Extract Node:
 *    - Selector CSS: ".row-puerto" (o similar, depende del DOM actual).
 *    - Atributos: Text Content.
 * 3. Code Node (JS) para mapear códigos:
 */

// Ejemplo de código para el nodo de "Code" en n8n:
const statusMap = {
  'ABIERTO': 'ABIERTO',
  'CERRADO': 'CERRADO',
  'RESTRINGIDO': 'RESTRINGIDO'
};

const portMap = {
  'PUERTO AGUIRRE': 'PAG',
  'PUERTO CHACABUCO': 'PCH',
  'PUERTO MELINKA': 'MEL',
  'PUERTO QUELLON': 'QUE',
  'PUERTO TENAUN': 'TEN',
  'PUERTO CHAITEN': 'CHA'
};

// Lógica de procesamiento de n8n
return items.map(item => {
  const rawName = item.json.name.toUpperCase();
  const rawStatus = item.json.status.toUpperCase();
  
  return {
    json: {
      port_code: portMap[rawName] || 'UNK',
      status: statusMap[rawStatus] || 'DESCONOCIDO',
      last_update: new Date().toISOString()
    }
  };
});

/**
 * 3. RECOMENDACIÓN FINAL: CACHÉ E INTELIGENCIA
 * -------------------------------------------
 * - Guarda siempre en `center_weather_snapshots` con el timestamp de la API.
 * - Tu semáforo en Next.js ya está programado para buscar siempre el registro más reciente.
 * - Si una API falla, el semáforo mostrará "EVAL" (Amarillo) porque detectará que los datos están viejos (> 4 horas).
 */
