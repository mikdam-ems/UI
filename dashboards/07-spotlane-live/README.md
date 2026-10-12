# Spotlane Live — user-testing build

The Spotlane parking journey on a **real map of Jordan**, built so drivers can test it on their own phones.

| What's real | What's simulated (clearly labelled in the UI) |
|---|---|
| Map and streets: MapLibre GL + OpenFreeMap tiles | Free spaces and live updates |
| Car parks: OpenStreetMap, via the Overpass API | Prices (except car parks tagged as free) |
| The tester's GPS location, with a demo spot in Amman as fallback | Floors, slots and EV bays |
| Place search: Photon, limited to Jordan | Payment (test mode, no money taken) |
| Driving routes and times: OSRM | Gate opening, parking session, receipt |
| Navigation: hand-off to Google Maps, Waze or Apple Maps | |

All services are free and need no API keys. They're listed in `CONFIG` at the top of the script.

## Share it with testers

Geolocation only works over **https**, so host the repo rather than sending the file:

- **GitHub Pages:** repo → Settings → Pages → deploy from your branch. The page is at
  `https://<org>.github.io/<repo>/dashboards/07-spotlane-live/`.
- **Netlify:** drag the repo folder onto app.netlify.com/drop.

Before sharing, set `CONFIG.feedbackEmail` to the address that should receive feedback.
If it's left empty, feedback is copied to the tester's clipboard.

## Running sessions

- **Give feedback** (top right) collects:
  - a 1–5 ease rating
  - what the tester was trying to do
  - their comments
  - the tester's steps, such as "hold", "paid" or "nav_handoff"
- The step log never includes location or contact details.
- **Scenarios** lets a moderator trigger edge cases on purpose, such as a slot taken at checkout, a declined payment or an expired hold.
- To send events to an analytics tool (PostHog, a Supabase function…), set `CONFIG.analyticsEndpoint`.

## Free-tier limits (fine for testing, not for launch)

- **OSRM demo server and public Overpass:** fair-use services. For a public launch, switch to a hosted provider or self-host.
- **OpenFreeMap:** free, but add your own attribution and monitoring before going public.
