# TOZRA Atlas — Integrated Module

## Added
- Atlas navigation entry and dedicated workspace page integrated into the existing TOZRA shell.
- World Explorer: searchable country directory and country detail cards powered by REST Countries API.
- Company Intelligence: company/entity discovery through Wikidata SPARQL, with source links.
- Technology Radar: current article discovery through GDELT DOC API, with source links and timestamps.
- AI Research: research prompt handoff to the existing TOZRA AI chat, with explicit instructions to cite sources and disclose uncertainty.
- Discovery Map: Leaflet map with OpenStreetMap tiles and Nominatim location search.
- Saved research topics stored locally in the browser.
- Responsive desktop/mobile layout using the existing theme variables and TOZRA styling.

## Notes and limitations
- Public data providers are third-party services; availability, rate limits, and coverage may vary.
- Company Intelligence surfaces Wikidata records; it is not a complete or authoritative company registry.
- Technology Radar aggregates news links from GDELT; it does not independently verify article claims.
- AI Research uses the existing TOZRA chat path. Source citations depend on the configured chat/search capabilities; the prompt explicitly asks the model not to invent sources.
- Discovery Map uses OpenStreetMap/Nominatim; attribution and fair-use policies apply.
- Saved Atlas research topics are currently browser-local. They are not synced to Supabase in this release.
- No existing Market, Social, authentication, chat, projects, or other module code was intentionally replaced.


## Atlas 2.0 update
- Fixed the invalid `viewer.pointsData(...)` call; country/capital markers now use Cesium entities.
- Added separately managed country and search marker collections so a new search no longer deletes other map entities.
- Added toggles for capital and search markers, plus clickable search result cards.
- Improved camera zoom limits, interaction inertia, resize handling, and mobile map controls.
- Country data request now includes `capitalInfo` for capital marker placement.
- Terrain remains the Cesium ellipsoid in this release; real elevation terrain is not claimed or enabled.


## TOZRA ATLAS MAX
- CesiumJS runtime and widget stylesheet upgraded to 1.145.
- Added satellite, topographic, and OpenStreetMap street imagery choices.
- Added Natural Earth country boundary GeoJSON layer.
- Added click/tap coordinate inspector with copy action.
- Added opt-in browser geolocation button. Location is used locally for camera navigation and is not sent to TOZRA's server by this feature.
- Added two-point geodesic surface distance measurement.
- Added optional Cesium World Terrain and OSM Buildings toggles.
- Optional terrain/building layers require `CESIUM_ION_TOKEN` in Vercel. The token is returned only by `/api/atlas-config` to the browser; configure it as a public client token restricted by allowed origins and assets in Cesium ion.
- Without a Cesium ion token, base 3D globe, imagery styles, borders, search, coordinate inspection, and distance measurement remain available. Terrain/building controls are disabled and report why.
- Existing country, company, technology, research, and saved-discovery panels remain in place.

Validation: JavaScript syntax and ZIP integrity checks are performed. Live provider availability, Cesium ion account permissions, browser WebGL rendering, and device-specific performance require deployment testing.
