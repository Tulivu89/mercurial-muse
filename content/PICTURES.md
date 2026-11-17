# The site's pictures

The pictures a new visitor sees on the worlds that come with the site: characters' faces, a Home's cover and its rooms. They live in GitHub beside the world, and the site reads them from GitHub through jsDelivr (a free picture service for public repositories), so your web server never sends them. A picture someone sets in their own browser always wins over these.

Each world keeps two things:

- `content/<world>/pictures/` holds the files.
- `content/<world>/pictures.json` says which file goes where.

HOG Wild's list:

```json
"characters": {
  "nova": { "avatar": "nova.png" }
},
"homes": {
  "house": {
    "cover": "outside.jpg",
    "rooms": { "showroom": "showroom.jpg" }
  }
}
```

## Change a picture

Upload the new file into the world's `pictures/` folder with **the same name** as the old one (on GitHub: open the folder, **Add file**, **Upload files**). GitHub replaces it. Nothing else to edit. It shows on the site after the next deploy.

## Add a picture

1. Upload the file into the world's `pictures/` folder. Use a plain name with no spaces, such as `pipa-room.jpg`.
2. Open `pictures.json`, click the pencil, add one line, and commit.
   - A character's face: `"avatar": "pipa.png"` under their id.
   - One of the 24 emotion pictures: `"happy": "pipa-happy.png"` beside the avatar.
   - A pose for Homes: `"fig:pnRead": "nova-reading.png"` (the figure's id from the Studio).
   - A room: `"pipas-room": "pipa-room.jpg"` under `rooms`.
   - The Home's card: `"cover": "outside.jpg"`.

Ids are the record ids in the world file (`nova`, `pipas-room`), not the names. Mind the commas: every line in a group but the last ends with one.

Or drop pictures in `sort/` with any name and ask Claude to sort them in.

## If it goes wrong

The deploy runs a check (`studio/tests/pictures.test.ts`) that every name in `pictures.json` is a real character, room and file. A typo stops the deploy with a message saying which one, and the running site stays as it was. Fix the line and deploy again.

## Size

Keep each file under 15 MB (jsDelivr's limit is 20 MB). Smaller loads faster for visitors: a face around 1000 pixels tall and a room around 2000 wide is plenty, and JPEG or WebP is far smaller than PNG for anything without a see-through background.

Animated GIF, WebP and APNG work. Video (`.webm`, `.mp4`) does not yet.
