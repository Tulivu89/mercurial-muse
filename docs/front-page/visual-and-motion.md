# Front-page composition and effects

Nov 12, 2026 · @AmbiProp

The aim is a literary front cover that becomes a useful desk. The artwork provides the spectacle. Type, alignment and brief motion give it presence. The interface uses the existing [Wet Ink brand](../brand.md), including its lacquer marks and the exception that lets those marks carry highlights and shading. In the application, reuse `kit/src/ink.css` for tokens/marks/motion, `wet-ink.css` for controls, and the shipped `SiteHeader` rather than copying the study's standalone CSS/header.

## Visual specification

| Element | Starting specification |
| --- | --- |
| Page width | Content up to 1280 px, centered, with fluid outside space |
| Wide layout | Two equal columns, 24 px gap; preserve panel positions |
| Narrow layout | One column at approximately 760 px; no sideways page scroll |
| Margins | 40 px on wide layouts, 18 px at 390 px |
| Type | Fraunces 600 display; Literata 400 prose/italic excerpts; Atkinson Hyperlegible Next 400/600 interface |
| Main title | About 55–62 px wide, 40 px phone; returning title 36–42 px |
| Panel titles | 25–27 px; marks around 32–34 px |
| Corners | Existing brand: 10 px panel, 6 px control, 4 px chip |
| Targets | Every action, room choice, summary control and select is at least 44 px high |
| Color | Exact Paper and Night tokens; scene/portrait art retains its own controlled palette |
| Main action | One dominant seal-red action: featured start on a first visit, Continue on returning visits |

The HTML includes a small design-control bar and explanatory artwork labels so reviewers can distinguish fixtures from a product. Remove those in the application after replacing fixtures. Preserve Included labels, meaningful state descriptions, storage messages, and model requirements.

The mockup embeds six Latin-subset WOFF2 files from the three Fontsource 5.3.0 packages. Their SIL Open Font Licenses are included in `mockup/FONT-LICENSES.txt` and in the HTML comments. There are no runtime requests for fonts and no npm dependency changes. In the product, reuse one shared font-loading strategy; extend language coverage when needed rather than copying these subsets indiscriminately.

## Motion budget

| Effect | Trigger | Amount and timing | Limits |
| --- | --- | --- | --- |
| Mark Settle | Initial page entry | Existing approved drop/squash/gleam treatment, around 900–1100 ms | Reuse `InkMark` and house CSS; do not invent another logo animation |
| Ink title | Initial entry | Existing soft left-to-right mask, shortened to about 780 ms in the study | Title remains in the DOM and readable; no typewriter loop or letter-by-letter delay |
| Panel settle | Initial entry | 7 px rise, 320 ms, 45 ms stagger, final panel ends by 455 ms | Never wait for scrolling; do not replay on room changes, data refresh or focus |
| Portrait lift | Intentional hover or keyboard focus | Artwork rises 3 px over 200 ms; labelled button stays in place | No tracking the pointer, tilted cards or moving hit targets |
| Cover lift | Hover over its related action | Cover rises 2 px over 180 ms | Fine-pointer enhancement; no information depends on it |
| Room change | User selects a room | Content settles 2 px over 180 ms with a brief opacity change | One transition per selection; resident state never changes because of an effect |
| Action feedback | Hover/focus/press | Clear color change and arrow movement of 3 px over 140 ms | Use focus outlines; never communicate selection by movement alone |

All effects finish. There are no ambient particle systems, page parallax, pulsing notifications, shimmers, autoplay camera changes, sound, or scroll interception. Do not add gradients or glow to interface surfaces. The approved lacquer marks retain their own shading.

The study has a Replay entrance button for review only. The product should not replay page-entry effects on ordinary Back restoration or updates. Motion must not prevent interaction during its run, obscure focus, or delay the Continue action.

## Reduced motion and failure behavior

- `prefers-reduced-motion: reduce` removes entrance, mask, lift, arrow and room-change motion. The complete composition remains visible.
- The study also offers an off switch. The operating-system preference wins, and Replay is disabled while motion is off.
- Visible content is the default. Animation is enhancement; unsupported masks must not leave text invisible.
- Loading placeholders are static. They communicate pending reads, not an endless activity loop.
- A failed image uses a deliberate illustration/initial fallback with its text intact. Keep the allocated dimensions to prevent layout jumps.
- Missing art never blocks reading, selecting a character, or opening a saved game.

## Artwork handoff

The scene and silhouettes in the mockup are original composition sketches carried over from this design conversation. They establish framing and contrast. They are deliberately labelled and do not claim to be approved portraits.

| Asset | Composition requirement | Production source |
| --- | --- | --- |
| Writing room | Wide scene; desk/resident readable in the central crop at 390 px; clear foreground and room depth | New room artwork, matched to approved Errata art |
| Kitchen | Same room family, an empty scene that still feels inhabited | New room artwork |
| Errata | Recognizable at small size; strong eyes/hair silhouette, room for name plate; seated key art can also appear in Home | Approved CharacterVault design; current bundled record for text |
| Other characters | Similar crop/finish without making every pose identical | Finished featured characters, not random catalogue filler |
| Bogwater cover | Title readable at the smallest cover size; fen/eel-run motif; cover repeats across world and adventure contexts | Existing world text, with new cover art |
| Adventure scene | Wide crop, evocative landscape; no plot spoilers beyond the saved scene | Authored or user-chosen scene artwork |

Use fixed aspect-ratio boxes and `object-fit`/placement rules, with focal points where necessary. Home must use the same room/figure placement logic as Chat; it cannot flatten a live room into promotional art and then claim residents are at their current positions. The view should remain useful with one resident and with none.

## Interaction and accessibility

- Logical DOM and keyboard order match visible order, including pinned characters. Do not use CSS ordering to make the visual selection disagree with keyboard traversal.
- Room choices are a group of pressed-state buttons. A tablist would require the complete tab keyboard pattern; the study intentionally uses ordinary buttons.
- Every room scene has a text equivalent. Resident names, activities, selected room and time are available outside the image.
- Never expose a hidden resident via alt text, counts, hover labels, source URLs or screen-reader announcements.
- Destination previews use a native modal dialog, a visible close control, Escape, contained keyboard focus and return focus. These previews are study controls; production actions navigate directly.
- Keyboard focus is a visible 3 px blue outline. Day and night use the established accessible token pairs.
- At 200% text scaling and 320 px layout width, controls wrap without clipping labels or hiding the main action.
- The first Continue action stays near the top on phones. No sticky overlay competes with the content or browser controls.
- Do not crop the world title to fit a cover. Treat the text beside it as the authoritative title and adjust artwork typography at small sizes.

## Performance constraints

Use CSS and the platform; this design needs no animation library. The study is approximately 225 KB including six embedded fonts and all vector drawings, before transfer compression. It is a reference, not a production bundling prescription.

The initial application view should use small summaries and selected artwork. Current readers load complete chats, worlds and portrait collections; avoid doing that for every dashboard visit as libraries grow. First ship correct bounded selection using existing readers, then introduce summary readers where profiling justifies them. Do not duplicate or alter schemas just for the mockup.

No model generation, background post synthesis, or provider-key requirement belongs to the dashboard load path. Read local state in parallel and allow independent panels to settle. Time projection uses the existing pure functions with an injected current time. Stop periodic refresh while hidden, and refresh when returning to the page.
