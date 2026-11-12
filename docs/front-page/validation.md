# Front-page groundwork: validation

Nov 12, 2026 · @AmbiProp

This record covers the standalone design study and the documentation change. It does not claim that Overview routes, shared activity metadata, a new example Home, or production dashboard integration have been implemented.

## Baseline

The branch was rebased onto main `3b0efb0` before the final repository checks. That baseline already includes Studio 0.14.0, Adventure 0.27.1 and Chat 0.3.1, including exact Studio routes, the common site header, maps and the Errata authoring door. The handoff and mockup destination notes were updated to reuse those features.

The pre-existing UI bid was preserved. Its content matched the version already merged into main; it is not part of this change.

## Mockup checks

Automated headless Chromium checks passed for **60 combinations**: six fixture states, Paper and Night, and widths of 320, 390, 768, 1280 and 1440 CSS pixels.

| Check | Result |
| --- | --- |
| First, returning, one-chat, empty/examples-hidden, storage-error and loading states | Passed |
| Horizontal page overflow across the 60 combinations | None |
| Visible buttons, selects and preview disclosure targets | At least 44 px high |
| World cover title at each tested width | No clipping |
| Continue visibility | Present for returning/one-chat fixtures; absent for first/empty/error/loading |
| Pinned character ordering | Matches DOM and keyboard order; pin before recent before included |
| Room selection | Selected state, scene, activity text and destination room update together |
| Empty kitchen | Resident hotspot removed; empty-room text remains available |
| Existing-chat destination | Continue targets the fixture conversation rather than new-chat setup |
| Destination dialog | Escape/close work; focus returns to the triggering control |
| Show examples | Restores included panels; focus moves to the visible Home title |
| Failed-read Retry | Announces the fixture's retry behavior; changes no library data |
| Preview state and theme changes | Controls and query string remain consistent |
| Fonts | All six embedded font faces loaded |
| External network requests | Zero in the state/layout/interaction run |
| Product storage access | `localStorage` and `indexedDB` access were made to throw throughout the state/layout/interaction run; no access occurred |
| Motion enabled | Ink title and panel entrance run; no animations remain running after the entrance settles |
| Motion disabled / operating-system reduced motion | Replay disabled; room changes and content remain usable without animation |
| Text enlarged to 200% at 390 px | No sideways page scroll after fixing wrapping in the title, navigation and panel headings |
| Detached standalone document | Embedded HTML/fonts/script loaded with `setContent`; destination interaction worked without an asset server |

The managed Chromium policy blocks direct `file://` navigation. A normal downloaded-file opening was therefore not tested in that browser. The detached-document check plus the absence of external script/stylesheet/asset dependencies establishes the portable single-file structure; direct file opening on the owner's device remains a manual check.

The screenshots were regenerated from the final study with reduced motion, so they show the settled layout:

- [First visit, Paper, 1280 px](mockup/screens/first-paper-wide.png)
- [Returning, Night, 1280 px](mockup/screens/returning-night-wide.png)
- [First visit, Paper, 390 px](mockup/screens/first-paper-phone.png)
- [Returning, Night, 390 px](mockup/screens/returning-night-phone.png)
- [One recent chat, Paper, 390 px](mockup/screens/partial-paper-phone.png)
- [Examples hidden, Paper, 1280 px](mockup/screens/empty-paper-wide.png)
- [Storage unavailable, Paper, 1280 px](mockup/screens/storage-error-paper-wide.png)

## Repository checks

All passed on the rebased branch:

- `npm test`: 674 passing tests across the workspace runs, including Adventure's repeated round-trip suite.
- `npm run lint`.
- `npm run build`.
- `git diff --check`.
- Local links in the new Markdown handoff and screenshot references resolve.

The build reports third-party Rollup annotation warnings from zod but succeeds. No package dependency, lockfile, application source, API, deployment route or browser database was changed by this handoff.

## Remaining checks belong to implementation

Browser checks here used fixtures. The next chat must test actual same-origin stored data, existing/deleted save IDs, multiple conversations/personas/scenarios, hidden Home residents, per-character time, cross-app resumption and legacy launch links as those integrations are built. The example household and final character artwork remain content work. Safari/iOS and assistive-technology testing were not performed in this environment.
