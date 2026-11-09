// CharacterRoom's macros (F-27), unchanged: {{char}} {{user}} {{date}} {{time24}} {{time}},
// and $c/$contact, $u/$user. Dates and times are read in the device's own time zone.
export function replaceMacros(text: string, charName: string, userName: string, nowMs: number): string {
  const now = new Date(nowMs);
  const two = (value: number) => String(value).padStart(2, '0');
  const hours = now.getHours();
  const dateStr = `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`;
  const timeStr = `${two(hours % 12 === 0 ? 12 : hours % 12)}:${two(now.getMinutes())} ${hours >= 12 ? 'PM' : 'AM'}`;
  const time24Str = `${two(hours)}:${two(now.getMinutes())}`;
  // Function replacements, so a "$" in a name is never read as a pattern.
  return text
    .replace(/\{\{char\}\}/gi, () => charName)
    .replace(/\{\{user\}\}/gi, () => userName)
    .replace(/\{\{date\}\}/gi, () => dateStr)
    .replace(/\{\{time24\}\}/gi, () => time24Str)
    .replace(/\{\{time\}\}/gi, () => timeStr)
    .replace(/\$c(?:ontact)?(?=\s|$|[.,!?;:\-'")])/gi, () => charName)
    .replace(/\$u(?:ser)?(?=\s|$|[.,!?;:\-'")])/gi, () => userName);
}
