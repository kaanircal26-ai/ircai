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
