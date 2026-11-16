# Chat and Home, finished

Nov 16, 2026 · @AmbiProp · What Chat 0.5.0, Studio 0.15.0 and Overview 0.3.0 built, from the owner's pass over Chat and Home. The changelog is in `chat/README.md`.

The pictures in `screens/` are from the built site in a headless browser at 390 px wide (the last at 1280), with a stand-in model. No room or portrait pictures are loaded, so rooms and faces show as initials.

| The owner's point | What was built | Picture |
| --- | --- | --- |
| 1. No way to make or manage a persona | **You**, a fourth place in Chat: make, edit, picture, your usual, delete, import a user card. A chat's sheet changes who you are in it. | `08-you.png` |
| 2. Nobody can tell what Home is; it sits under an adventure world; a home can't be built in the Studio | Home opens on a list that says what a home is. A world can be a **household**, which no side offers as an adventure. The Studio has **New household** and a **Home door** on every scenario. A character's card says where they live. | `01-homes.png`, `10-studio-home-door.png` |
| 3. The home choice is a dropdown | Each home is a card with who is in and what they are doing. Each has an address. | `01-homes.png`, `02-house.png` |
| 4. Homes aren't on the Overview | A **Homes** panel beside Characters, and a home can be the page's Continue. Households left the Worlds panel. | `09-overview.png` |
| 5. Brackets as directives, entered without prompting a reply | A **note**: a bracketed line that goes into the chat as nobody's turn and asks for no reply. Typed in brackets, or sent with the note button. | `04-note-in-chat.png` |
| 6. Remember under a message cut the message short and only saved it | A **brain button** beside the message box and on each message opens Memory's four: a journal entry, Reflect, Process, Plan. | `05-memory.png` |
| 7. Posts from CharacterRoom | A feed in each home and on each character's sheet: a post about their day or a chat, comments from housemates and strangers, your own, and the line a photo is made from. | `03-posts.png` |
| 8. The header should give set choices; chats need Home in them | The **character's sheet**: sets as choices and lore as switches, their day at home with needs and actions, their posts, and who you are. A house button in the header, and Go to the house. | `06-sheet-now.png`, `07-sheet-home.png`, `11-wide-chat-and-home.png` |

## Decisions made while building, open to veto

1. **A home is still a scenario with rooms.** Nothing new is stored for one, so the resort, HOG Wild and imported scenario cards are homes already. An author can keep a scenario with rooms out of Home (`homeListed`).
2. **A world says what it is for.** `use: household` on the world. The Studio's About page has the choice. The resort, HOG Wild and Chat's shelf of imported cards are marked in place in a browser that has them, so nothing arranged there is lost.
3. **A note is nobody's turn.** For Xialong it is a system message in the chat, as the style line is. For other models it rides in the player's turn, in its brackets, because several prompt formats move a late system message to the top. A plan's countdown doesn't count a note as a turn.
4. **A bracketed draft is a note however it is sent.** Enter on `[Later that night]` adds it and asks for nothing. To get an answer, send the next message, or Send with the box empty. Brackets inside a message are part of that message, as before.
5. **Posts belong to the character, not to a chat.** One feed per character, like their day, read by Home and by every chat with them. A post about their day needs no chat at all.
6. **Nothing is written without a press.** A post, a comment and a photo line are each one request, started by the player and (for a post) shown first. This is CharacterRoom's rule (D-40, D-69).
7. **A commenter never sees the chat.** A comment is sent the post, the comments under it, and for a housemate their own short sheet. A stranger gets no sheet.
8. **The photo line is the image hook.** The character says in one plain line what they would attach; the line is kept on the post. A picture is uploaded against it for now. When the site makes images (roadmap step 7), that line is what one is asked for with.
9. **The prompts for Xialong are CharacterRoom's own**, copied from `characterroom.naiscript` (engine 0.2.x): the thread's shape, the time frame, the day post's prohibition, the comment and photo messages, and their budgets and temperatures.

## To check with a real key

The build session has no key. These need one try each:

1. **A post on Xialong:** whether the reply carries on from `Thread:` and comes back with a title, a `====` line and a body.
2. **A comment on Xialong** from a housemate, started on their name.
3. **A note on Xialong:** whether she takes it as true or answers it out loud. If she answers it, it can ride in the player's turn as it does elsewhere.
4. **Posts and comments on GLM-4.6 or DeepSeek:** whether the layout holds (`Thread:`, `====`, `Emotion:`).

## Not built

- Image generation for a post's photo, a room or a figure (roadmap step 7).
- A one-press narration of the away replay.
- Telling the model when a set member was pinned by hand, in the changelog's form (`docs/content/hog-wild/01-decisions.md`).
- An example world for the Overview's Worlds panel, now that the households have left it.
