# Courses Played

Track the golf courses you've played: search or add courses on a map, log rounds with a rating and notes, see who else has played a course, and swap recommendations in the forum.

This started as a Dev Academy bootcamp project (`boilerplate-react-webpack`) whose original code was lost. It's been rebuilt from scratch with a modernized stack.

## Stack

- **Client**: Vite, React 18, React Router v6, Firebase Auth + Firestore, custom interactive SVG map of New Zealand, Bulma (styling)
- **Server**: Express + Knex/SQLite for the course catalogue (seeded from OpenStreetMap)
- **Auth / user data**: Firebase Authentication (email/password) and Cloud Firestore (profiles, played rounds, friends, forum)
- **Tests**: Vitest — Supertest on the server, React Testing Library on the client

## Setup

1. Create a Firebase project, enable **Email/Password** auth and **Firestore**.
2. Copy web config into `client/.env` (see `client/.env.example`).
3. In Firebase Console → Firestore → Rules, paste `firestore.rules` from this repo and publish.
4. Install and seed courses:

```sh
npm install
cp .env.example .env
cp client/.env.example client/.env   # then fill Firebase web config
npm run migrate
npm run seed
```

## Development

```sh
npm run dev
```

Runs the Vite dev server (`http://localhost:8080`) and the Express API (`http://localhost:3000`) together. Vite proxies `/api/*` requests to the Express server.

## Production

```sh
npm run build   # builds the client into server/public
npm start        # builds, then serves client + API from a single Express process
```

## Tests

```sh
npm test              # server + client
npm run test:server   # Supertest, against an in-memory sqlite db
npm run test:client   # Vitest + React Testing Library
npm run eval:rounds   # scores the round parser against the real model (needs a model key)
npm run eval:screening   # checks the Jev screen blocks injections and lets real rounds through (needs a Jev key)
npm run eval:scorecards  # scores the scorecard reader against your own photos (see below)
```

## Log a round in plain English

`/log` takes something like "played Titirangi yesterday, shot 92, windy" and turns it into a round you check before saving.

1. **Read.** `POST /api/v1/rounds/parse` (signed-in users, 10 a minute) sends the text to a model with no tools, and gets back structured fields: course as written, date, holes, score, rating, notes, and par / course rating / slope if mentioned.
2. **Check in code.** Everything the model returns is bounds-checked (dates, scores, ratings, slope) before the app sees it. The course is matched against the catalogue by `server/lib/courseMatch.js`, not by the model, so it cannot invent a course. An ambiguous name returns candidates, and a course that isn't in the catalogue returns none. Nothing is ever added to the catalogue.
3. **Confirm.** The endpoint only proposes. The round is written to Firestore, and the course marked as played, when the golfer presses Save.

**Handicap.** `client/src/lib/handicap.js` suggests one from your rounds: score differential per round, `(113 / slope) x (score - course rating)`, then the World Handicap System table (best 8 of the last 20, with the adjustments for fewer). It uses 18-hole rounds only, with gross scores, and it is an estimate: rounds without a course rating and slope fall back to score minus par and the result is labelled "an estimate". It is only applied to your profile when you press the button.

Setup: set `OPENROUTER_API_KEY`, or `ANTHROPIC_API_KEY` if you don't have one (see `.env.example`); OpenRouter wins when both are set, and `MODEL_PROVIDER` forces one. Each provider has its own default model names (`server/lib/providers.js`), and `ROUND_PARSER_MODEL` / `SCORECARD_PARSER_MODEL` override them. OpenRouter calls ask for strict JSON-schema output, only route to providers that support it, and set `data_collection: deny` because a scorecard photo can carry a name. Without a key the endpoint returns 503 and everything else works.

**Demo mode.** With no key, `DEMO_MODE=true` in `.env` lets the whole flow be shown anyway. Typed text is read by a few plain rules (score, "+14", "yesterday", "last Sunday", d/m/yy, front nine, and the words before the score as the course), a stand-in screen blocks obvious injections, and any photo returns the same sample card (18 holes, one hole marked hard to read, no date so the required-date step shows). Results carry `demo: true` and the app shows a "Demo mode" banner, so it can't be mistaken for the real thing. The course is still matched in code and nothing is saved until you confirm. A real key always overrides it, `npm run eval:*` never uses it, and it is not evidence the AI works.

**Jev screen.** With `JEV_API_KEY` set, the typed text goes to Jev (TypeSafe System One) first, which classifies it as `round`, `instruction` or `other`. Only a `round` at 0.6 confidence or more reaches the language model, so an instruction or an off-topic message never gets to it. That threshold and the routing are code, not Jev. If Jev is configured but errors, times out or answers oddly, the request is refused (503) instead of skipping the check. Blocked inputs are logged with the label and confidence but not the text. With no key the screen is skipped and the response says `screening: "skipped"`. Photos are not screened, because Jev takes text only. `npm run eval:screening` runs 14 cases (real rounds, injections, an injection hidden inside a real round, off-topic text) and reports missed blocks and false blocks separately. Not yet run against the real classifier. Set `LANGFUSE_PUBLIC_KEY` and `LANGFUSE_SECRET_KEY` to trace each model call; leave them blank and tracing is off.

`server/evals/rounds.cases.json` holds 28 hand-labelled descriptions (ambiguous courses, injection attempts, impossible scores, relative dates). `npm run eval:rounds -- --repeat 3` runs them against the real model and prints per-field accuracy; scores vary between runs, so repeat before trusting a small change. `tests/server/roundEval.test.js` runs the same cases through a perfect stand-in model, which tests the matching and validation code with no API.

## Photograph a scorecard

Below the text box on `/log`, choose a photo of a scorecard (on a phone this opens the camera). The whole card is read, then you check it before anything is saved.

1. **Shrink.** The browser resizes the photo to 1568px and re-encodes it as a JPEG before it is sent (`client/src/lib/image.js`).
2. **Read.** `POST /api/v1/scorecards/parse` (signed-in users, 5 a minute, sits behind its own 7MB body limit) sends the image to a vision model with no tools. It copies what is printed and written: course, date, tee, course rating and slope, then each hole's par, distance and stroke index, and each player row's score for every hole plus the Out / In / Total figures. Blank or unreadable cells are null, and digits it isn't sure of (a 4 or a 9) are marked hard to read.
3. **Check in code.** The server checks the file bytes, not the claimed type (JPEG / PNG / WebP, 5MB max), bounds-checks every value, works out Out / In / Total from the holes, and compares them with the totals written on the card. The course is matched to the catalogue by code, as with text.
4. **You confirm.** Every hole is an editable box, hard-to-read holes are highlighted until you touch them, and you pick which row is you. Save is disabled until the date is set and all holes are filled. The round is stored with `holeScores` (strokes and par per hole), tee, and `source: 'scorecard'`. **The photo is never stored**, and only its size and type go to Langfuse, not the image.

Text written on a card is untrusted, like a forum post: the model has no tools, it is told to ignore anything in the photo that reads like an instruction, and a wrong or planted value can't get past the checks or the confirm screen.

**Real NZ cards.** The reader has been given hints from two real NZ Golf DotGolf cards: the course name can be small footer text beside the card number, "Tee 1" is the starting hole and not a tee, the course rating is labelled NZSCR, and the card has a grid for marking scores with crosses (columns 1 to 9, a +10 box, and a Pick Up box) that is read when the player's row in the table is blank. Only blank cards have been tried so far, so reading a *filled* card, in either style, is untested. Those two cards are saved as local fixtures in `server/evals/scorecards/`: a test runs their answers through the whole checking and matching pipeline with no API, and `npm run eval:scorecards` will test the real model on them once you have a key.

**Testing it on real cards.** Put photos in `server/evals/scorecards/` as `name.jpg` with a `name.expected.json` beside each (format at the top of `server/evals/runScorecards.js`), then `npm run eval:scorecards -- --repeat 3`. It reports holes read correctly and, most importantly, **silent errors**: holes read wrong that were *not* flagged as hard to read, because those are the ones you won't double-check. Photos and answers are git-ignored. Even two or three cards is a useful start. The default model is `claude-sonnet-5`; set `SCORECARD_PARSER_MODEL` to change it.

## Ask the chatbot

A small chat widget ("TeeBox") sits in the bottom-right corner on every page
(`ChatWidget.jsx`), open to signed-out and signed-in golfers alike. It works in two cheap
text-only model steps, never one open-ended conversation: first it classifies the typed
message (plus a little conversation history, see below) into one of a few fixed questions
(or `off_topic`), then — once code has looked up the real answer — it asks the model to
phrase *only those facts* as a sentence. The model never sees the database and never writes
an answer from its own knowledge, so it cannot invent a course, par, contact detail, score
or date that isn't in the facts it was handed.

- **Memory is real but deliberately small and temporary.** The browser tab keeps the last
  few messages of the conversation in React state (`ChatWidget.jsx`) — nothing is saved to
  a database, nothing survives a page reload, and nothing is shared between tabs or
  devices. The last six messages go to the server with each new question purely so a short
  follow-up like "what about Wellington instead" or "and its phone number" can be
  understood; the classifier is told explicitly to use it only for that, never to answer
  something that was only asked earlier. It is not a transcript the model can be asked to
  recap or re-list from — a question still has to stand as a real question on its own.

- **Public, no sign-in needed:** which courses exist, optionally narrowed to a region or a
  *town* ("what courses are in Auckland" — not just "the North Island"); a course's par,
  holes, website or phone number; comparing two named courses against each other.
- **Personal, needs sign-in:** how many/which courses are left to play (also narrowable to
  a region or town), your last round at a named course, your current handicap. Code checks
  `req.userId` before any of this runs — a signed-out golfer gets a fixed refusal and the
  model is never asked a personal question on their behalf. The user id always comes from
  the session, never from anything typed into the chat box.
- **Why personal questions take two requests.** Played rounds live in Firestore, readable
  only from the signed-in browser (no Firebase Admin credentials on this server). So a
  personal question comes back as `{ needsData }` naming one of the client's own
  functions (`getMyPlayedCourses` / `getMyPlayRounds`); the browser calls it and asks again
  with the result. The handicap is cheaper still — it's already sitting in the signed-in
  user's profile in React context, so that "fetch" is just a local read, no network call.
  `client/src/components/ChatWidget.jsx` is the whole loop.
- **A region or a town** both go through one `location` field the classifier fills in
  verbatim, resolved in code (`locationFilter` in `server/lib/golfChat.js`). "North
  Island"/"South Island" match the checked island lookup below. For a handful of major
  centres (Auckland, Wellington, Christchurch, Hamilton, Tauranga, Dunedin) a town name is
  resolved by real distance from that town's centre (`TOWN_CENTERS`, coordinates checked
  against Wikipedia, each radius chosen by looking at where this app's own course data
  actually thins out past that town) — this is what makes it find a course at all when,
  as is true for most of the catalogue, it has no specific city on file but genuinely is a
  few km from the centre asked about. (This was a real bug: matching the `city` column
  alone found 9 of the roughly 40 real Auckland-area courses.) Any other town falls back to
  an exact `city` column match; a town recognised by neither path is reported as such in
  the facts, rather than silently looking like zero courses exist.
- **North Island / South Island** comes from a checked city lookup (`ISLAND_BY_CITY` in
  `server/lib/golfChat.js`), not a guess — Wellington and Nelson sit at almost the same
  latitude on opposite sides of Cook Strait. Courses with a specific city use that lookup;
  the many courses imported with a generic city fall back to a latitude cut, which is a
  labelled approximation, the same spirit as `par_source = 'osm'` below.
- **Not yet covered:** "which of my friends have played this course" was considered but
  left out — the app has a friends-summary feature (`coursesPlayed.getPlayedSummaryForCourse`)
  but it reads a SQLite table nothing in the current client actually writes to (played
  status is tracked in Firestore instead), so it would have surfaced stale/empty data
  dressed up as a real answer.
- **Setup:** uses the same `OPENROUTER_API_KEY` / `ANTHROPIC_API_KEY` as everything else;
  `CHAT_MODEL` overrides the model. No Jev screen in front of this one — the blast radius
  is small (read-only lookups, the personal tools are scoped server-side by session, not
  by anything the model is told), so a plain system prompt does the topic-scoping instead.
  Not yet run against a real key.

## Course par

The handicap needs a par for each round, and text rounds never state one, so the catalogue carries it. `courses` has `par`, `hole_pars` (each hole, as JSON) and `par_source`.

- **Where it comes from.** `npm run import:par` (run `npm run migrate` first) reads golf-hole data from OpenStreetMap and sets a course's par only when its holes 1 to 9 or 1 to 18 are all found exactly once with plausible values (`server/lib/parFromOsm.js`). Anything partial, duplicated or odd is skipped rather than guessed, and a par that already has a source is never overwritten. `-- --dry-run` reports without writing. Today that covers about 60% of the catalogue (257 of 431).
- **It is approximate.** OSM par is volunteer-mapped, so it is stored as `par_source = 'osm'` and shown as "approx." on the course page. Some will differ from the official card (Jacks Point comes out at 69), so the log page fills it in as a suggestion, says where it came from, and lets you change it. A par the golfer states, or one printed on a scorecard photo, always wins. The model is never asked to supply a par.
- **The right par for the holes played.** `client/src/lib/coursePar.js` uses the front nine for 9 holes on an 18-hole course, and doubles a 9-hole course played twice.
- **Duplicate listings.** The catalogue lists some courses twice ("Titirangi Golf Club" and "Titirangi Golf Course"). Saved rounds point at these rows by id, so they aren't merged. Instead the matcher treats identical names close together as one course (`server/lib/courseTwins.js`), offers the copy that has a par, and the import copies par onto the twin.
- **Courses with no par** (the other 40%) still work: par can be typed in, or comes from the scorecard photo.

## Te Reo names and macrons

Twelve courses have macrons in their names (Ōtaki, Whakatāne, Te Ārai, and so on), and many golfers type them without. Everything that finds or orders a course therefore ignores accents:

- **Ordering.** `GET /courses` sorts with a real collator in `server/models/courses.js`, not SQLite's `ORDER BY`, which compares raw character codes and sent every "Ō" name, and any lower-case name like "prodrive Golf", to the end of the list.
- **Search.** The API search, the courses list and the map filter all fold accents, case, apostrophes and spacing (`server/lib/courseMatch.js` and `client/src/lib/text.js`), so "otaki" finds "Ōtaki" and "Ōtaki" finds "Otaki".
- **Matching what someone wrote.** A round described in text, or read off a scorecard, matches the same way, in both directions. The eval set has cases for it (`macron-*` in `server/evals/rounds.cases.json`).
- **Duplicates.** Two courses are listed twice, with and without the mark (Te Arai / Te Ārai Links, and Jack's / Jacks Point). Saved rounds point at these rows by id, so they aren't merged; matching treats them as one course.

## Project structure

```
client/           Vite + React app (src/pages, src/components, src/apiClient.js)
server/
  db/             knexfile, connection, migrations, seeds
  models/         db-access functions per resource
  routes/         Express routers per resource
  middleware/     requireAuth, asyncHandler
tests/server/     Supertest suites
client/tests/     Vitest + RTL suites
```

## Data model

- `users` — account + hashed password
- `courses` — user-submitted golf courses (name, city, country, lat/lng)
- `courses_played` — a user's log of rounds played (date, rating, notes)
- `forum_posts` / `forum_replies` — a simple forum

Course data is entirely user-submitted (no external golf API) — the seed script just loads a real starter list so search/map/profile aren't empty on first run.

The top nav (`client/src/components/Nav.jsx`) only renders once signed in, with links to Courses, Profile, and Sign Out — signed-out visitors use the Register/Sign In buttons on the home page instead.

## Map

The course map (`client/src/components/CoursesMap.jsx`) is an interactive SVG of New Zealand's regional council boundaries — not map tiles — with course pins plotted via a lat/lng projection (`client/src/nzProjection.js`) fit exactly from calibration points embedded in the source file. Click a pin to see the course and a link to its detail page; while adding a course, click anywhere on the map to set its location.

Regions are selectable too: click a region to highlight it and filter the course list down to courses within its boundary (using the browser's native `isPointInFill` against the real region path — not a bounding-box approximation). Click the region again or "Clear" to reset.

Region borders are drawn as a separate overlay (`client/src/nzBorders.js`) containing only the edges shared between two adjacent regions — detected by parsing each region's straight-line path data and matching coordinates — so the map shows internal boundaries without an outline around the coastline.

The outline artwork (`client/src/assets/nz-map-source.svg`) is from [simplemaps.com](https://simplemaps.com) (free for commercial use — see the license header in that file); region path data lives in `client/src/nzRegions.js`, and `NzOutline.jsx` renders it.
