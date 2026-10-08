# dayflow availability cards — design

## product idea

dayflow remains a small local-first editor for beautiful schedule cards. The product becomes useful beyond personal planning by making the output shareable in two ways:

- **plan**: a readable card with event names, times and statuses;
- **availability**: a privacy-preserving card that shows busy blocks and open windows without exposing event names.

The editor calculates a compact day summary from the schedule: active event count, planned minutes and free windows. This turns the existing image export into a practical artifact for coordinating with other people.

## audience and success criteria

The primary users are students, freelancers, creators and small teams who need to send a simple visual answer to “when are you free?” without giving another person access to a calendar account.

The first release succeeds when a user can:

1. open the app and understand the two output modes without onboarding;
2. add or edit events with reliable times;
3. see overlapping events and free windows immediately;
4. export a polished PNG in either plan or availability mode;
5. export the full active day as one ICS file;
6. export/import a JSON backup without a server;
7. use the app on a narrow phone viewport with keyboard and screen-reader support.

## product behavior

Each schedule has a selected date, a short optional label and lessons. A lesson contains title, start, end and status. Cancelled lessons are excluded from calculations and exports.

Derived values:

- activeLessons: planned and moved lessons;
- totalMinutes: sum of active lesson durations;
- freeWindows: gaps between the day bounds and active lessons, with a minimum length of 30 minutes;
- conflicts: pairs of active lessons whose intervals overlap;
- dayBounds: first active start and last active end, with 30-minute padding for an empty or single-event day.

The editor shows a summary strip with these values. A warning row appears only when there are conflicts. Free windows are listed in the preview and rendered as “свободно” in availability mode.

Export modes:

- plan PNG includes event title, time and a status mark for moved events;
- availability PNG renders only busy intervals and free windows;
- plan ICS contains one VEVENT for every active lesson;
- JSON export contains a versioned document with date, label and lessons; import validates the structure before replacing local data.

## visual direction

The interface is a quiet editorial sheet, not a dashboard:

- off-white canvas, dark ink, one pine accent and hairline borders;
- one strong typographic headline, compact monospace time labels;
- no gradients, glass, rounded card stacks, progress rings, fake analytics or AI language;
- output cards use flat paper-like surfaces and generous margins;
- availability mode uses “занято” and “свободно” as text labels and an understated hatch pattern, never loud color coding;
- all public UI copy stays lowercase except technical abbreviations such as PNG, ICS and JSON.

## architecture

Keep Astro as a static shell and browser-only state. Extend src/lib/schedule.ts with pure derived helpers and validation. Extend src/lib/ics.ts with a day serializer. Keep UI in src/pages/index.astro for this small project, but separate pure export calculations from DOM concerns.

Storage keys are versioned:

- dayflow-document stores { version: 2, date, label, lessons };
- old dayflow-lessons data is read once as a migration fallback;
- theme, style, export mode and repository-link preference remain separate settings.

No data is uploaded. JSON import/export is the only cross-device path in this release.

## verification

- unit tests cover free-window calculation, conflict detection, summary totals, JSON validation and full-day ICS;
- npm test and npm run build must pass;
- browser smoke test covers mode switching, adding a lesson, conflict warning, JSON round-trip and PNG download;
- manual responsive check at 390px and 1440px in light/dark themes and reduced-motion mode.

