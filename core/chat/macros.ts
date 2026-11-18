// CharacterRoom's macros (F-27), unchanged: {{char}} {{user}} {{date}} {{time24}} {{time}},
// and $c/$contact, $u/$user. Dates and times are read in the device's own time zone.
export function replaceMacros(text: string, charName: string, userName: string, nowMs: number): string {
  text = cardMacros(text, nowMs);
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

// What cards from other apps use beyond CharacterRoom's set (Character Card V3's required macros
// and SillyTavern's common ones), so none of it reaches a model as raw braces. Added before
// CharacterRoom's own and touching nothing it uses (docs/reviews/standards/decision.md, X1).
//   {{random:a,b}} {{random::a::b}}   a fresh pick each time a prompt is built
//   {{pick:a,b}} {{pick::a::b}}       the same pick every time for the same list
//   {{roll:20}} {{roll:d20}} {{roll 2d6}} {{roll::1d20}}
//   {{weekday}} {{isodate}} {{isotime}} {{reverse:text}}
//   {{// a note}} {{comment: …}} {{hidden_key: …}} {{original}} {{noop}} {{trim}}   nothing
//   {{newline}}                        a line break
//   variables ({{setvar::x::1}}, {{getvar::x}} …)   nothing: Inkwyrm keeps no card variables
const hash = (text: string) => { let h = 2166136261; for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619); return h >>> 0; };
const options = (body: string) => (body.startsWith(':') ? body.slice(1).split('::') : body.split(/(?<!\\),/)).map((option) => option.replace(/\\,/g, ',').trim());
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export function cardMacros(text: string, nowMs: number): string {
  if (!text.includes('{{')) return text;
  let turn = 0;
  const now = new Date(nowMs);
  const two = (value: number) => String(value).padStart(2, '0');
  return text
    .replace(/\{\{\/\/[\s\S]*?\}\}|\{\{(comment|hidden_key):[\s\S]*?\}\}/gi, '')
    .replace(/\{\{\s*(set|get|add|inc|dec|has|delete|flush)(global)?var(key|index)?(::|\s)[^}]*\}\}/gi, '')
    .replace(/\{\{(original|noop|trim)\}\}/gi, '')
    .replace(/\{\{newline\}\}/gi, '\n')
    .replace(/\{\{random:([^}]*)\}\}/gi, (_, body: string) => { const list = options(body); turn += 1; return list[hash(`${nowMs}:${turn}:${body}`) % list.length] ?? ''; })
    .replace(/\{\{pick:([^}]*)\}\}/gi, (_, body: string) => { const list = options(body); return list[hash(body) % list.length] ?? ''; })
    .replace(/\{\{roll(?:::|:|\s+)\s*(\d*)d?(\d+)\s*\}\}/gi, (_, count: string, sides: string) => {
      const dice = Math.min(Math.max(Number(count) || 1, 1), 100);
      const faces = Math.max(Number(sides) || 1, 1);
      let total = 0;
      for (let die = 0; die < dice; die += 1) { turn += 1; total += (hash(`${nowMs}:roll:${turn}`) % faces) + 1; }
      return String(total);
    })
    .replace(/\{\{weekday\}\}/gi, () => WEEKDAYS[now.getDay()]!)
    .replace(/\{\{isodate\}\}/gi, () => `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())}`)
    .replace(/\{\{isotime\}\}/gi, () => `${two(now.getHours())}:${two(now.getMinutes())}`)
    .replace(/\{\{reverse:+([^}]*)\}\}/gi, (_, body: string) => [...body].reverse().join(''));
}
