# n8n Workflow Templates & Logic

These templates are designed to work with the schema established in Supabase for Maritime Operational Integration.

## 1. Weather Worker (Stormglass)
**Goal:** Fetch weather data for active center locations and store snapshots.

### Logic Flow:
1. **Cron:** Run every 1h (at minute 0).
2. **Supabase (Select):** Get active locations with `type = 'center'`.
3. **HTTP Request (Stormglass):** Loop through centers, calling `https://api.stormglass.io/v2/weather/point`.
4. **Set:** Extract `windSpeed`, `windGust`, `waveHeight`, `visibility` from the first forecast hour.
5. **Supabase (Insert):** Save to `center_weather_snapshots`.

### Supabase Node Configuration (Insert):
```json
{
  "location_id": "={{$node[\"Supabase Select\"].json[\"id\"]}}",
  "wind_speed": "={{$json[\"windSpeed\"][\"noaa\"]}}",
  "wind_gust": "={{$json[\"gust\"][\"noaa\"]}}",
  "wave_height": "={{$json[\"waveHeight\"][\"noaa\"]}}",
  "visibility": "={{$json[\"visibility\"][\"noaa\"]}}",
  "timestamp": "={{$json[\"time\"]}}"
}
```

---

## 2. Port Status Worker (SITPORT Scraper)
**Goal:** Scrape the status of key ports and update the database.

### Logic Flow:
1. **Cron:** Run every 30m.
2. **HTTP Request:** Fetch HTML from `https://sitport.directemar.cl/`.
3. **HTML Extract:** Target the table/div containing port statuses.
4. **Code (JS):** Mappe physical names to codes (e.g., "CHACABUCO" -> "CHA").
5. **Supabase (Upsert):** Update `external_port_status` based on `port_code`.

### Port Mapping Snippet (Code Node):
```javascript
const nameMap = {
  'PUERTO MELINKA': 'MEL',
  'PUERTO AGUIRRE': 'AGU',
  'PUERTO CHACABUCO': 'CHA',
  'PUERTO QUELLON': 'QUE',
  'PUERTO TENAUN': 'TEN',
  'PUERTO CHAITEN': 'CHT'
};

const status = item.status.toUpperCase().includes('CERRADO') ? 'CERRADO' : 
               item.status.toUpperCase().includes('RESTRINGIDO') ? 'RESTRINGIDO' : 'ABIERTO';

return {
  port_code: nameMap[item.name] || 'UNK',
  status: status,
  last_update: new Date().toISOString()
};
```

---

## 3. Decision Evaluation (Self-Verification)
**Goal:** Verify that the logic in Next.js works as expected.

### SQL for Manual Testing:
```sql
-- Simulate bad weather in Melinka center
INSERT INTO center_weather_snapshots (location_id, wind_speed, wave_height, timestamp)
VALUES ('UUID_OF_CENTER', 45, 3.5, NOW());

-- Simulate closed port in Quellón
UPDATE external_port_status SET status = 'CERRADO' WHERE port_code = 'QUE';
```
