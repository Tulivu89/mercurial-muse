// A feed: what the people of a house, or one character, have posted (CharacterRoom's Posts).
// A post is asked for with a press, about their own day or about a chat, and is shown what it
// would send first. Under each post come comments: one press writes one, from a housemate, a
// stranger the model names, or now and then the author; the player can say something too. A
// post's picture is uploaded for now. What they would attach is asked in words and kept, and is
// what an image will be made from once the site makes images.
import { useRef, useState, type ChangeEvent } from 'react';
import { POST_NAMES, elapsedText, lifeKey, lifeNow, postSlot, stampOf, type Chat, type Life, type Post, type PostKind } from '../../core/chat/index.js';
import type { StoryRecord, World } from '../../core/records/index.js';
import { IMAGE_TYPES, MediaImage, animationSlot, posterSlot } from '../../kit/src/media';
import { BinIcon, CommentIcon, EditIcon, MoreIcon, PhotoIcon, PinIcon } from './icons';
import { Portrait } from './Portrait';
import type { PostApi, PostReady } from './posting';
import { RichText } from './RichText';
import { portraitOwner, type PortraitSet } from './store';

export interface Subject { world: World; record: StoryRecord; life: Life; chat?: Chat }

const A_FEW = 3;

export function Feed({ api, subjects, portraits, onPicture, heading = 'Posts' }: {
  api: PostApi;
  // Whose posts these are, and who can be asked for one.
  subjects: Subject[];
  portraits: Record<string, PortraitSet>;
  onPicture: (owner: string, slot: string, file: File | null) => void;
  heading?: string;
}) {
  const [ready, setReady] = useState<PostReady | null>(null);
  const [busy, setBusy] = useState('');
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const [menu, setMenu] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; title: string; content: string; photo: string } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [stopping, setStopping] = useState(false);
  // Stop is read between comments, never mid-request.
  const stop = useRef(false);

  const keys = new Map(subjects.map((subject) => [lifeKey(subject.world.id, subject.record.id), subject]));
  const posts = api.posts.filter((post) => keys.has(post.key)).sort((a, b) => Number(b.kept) - Number(a.kept) || b.madeAt - a.madeAt);
  const lastOf = (subject: Subject) => api.posts.filter((post) => post.key === lifeKey(subject.world.id, subject.record.id)).reduce((best, post) => Math.max(best, post.at), 0);

  const ask = async (subject: Subject, kind: PostKind) => {
    setNote(''); setText('');
    const result = await api.preview(subject.world, subject.record, kind, subject.chat);
    if (typeof result === 'string') { setNote(result); setReady(null); return; }
    setReady(result);
  };
  const write = async () => {
    if (!ready) return;
    setBusy('post'); setText('');
    const result = await api.write(ready, setText);
    setBusy('');
    if (typeof result === 'string') { setNote(result); return; }
    setReady(null); setText('');
  };
  const comment = async (post: Post, count: number) => {
    setNote(''); setStopping(false);
    stop.current = false;
    setBusy(`c:${post.id}`);
    for (let made = 0; made < count && !stop.current; made += 1) {
      const wrong = await api.comment(post.id);
      if (wrong) { setNote(wrong); break; }
    }
    setBusy(''); setStopping(false);
  };
  const photo = async (post: Post) => {
    setNote('');
    setBusy(`p:${post.id}`);
    const wrong = await api.describePhoto(post.id);
    setBusy('');
    if (wrong) setNote(wrong);
  };
  const upload = (post: Post) => (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) onPicture(portraitOwner(post.worldId, post.characterId), postSlot(post.id), file);
  };
  const remove = (post: Post) => {
    if (!window.confirm('Delete this post and its comments?')) return;
    onPicture(portraitOwner(post.worldId, post.characterId), postSlot(post.id), null);
    api.remove(post);
    setMenu(null);
  };

  return (
    <section className="feed" aria-label={heading}>
      <div className="feed-ask">
        {subjects.map((subject) => {
          const last = lastOf(subject);
          const now = lifeNow(subject.life, Date.now());
          return (
            <div key={lifeKey(subject.world.id, subject.record.id)} className="feed-who">
              <Portrait name={subject.record.name} set={portraits[portraitOwner(subject.world.id, subject.record.id)]} size={40} />
              <span className="feed-who-text">
                <b>{subject.record.name}</b>
                <small>{last && last <= now ? `Last posted ${elapsedText(last, now)} ago` : 'Hasn’t posted yet'}</small>
              </span>
              <span className="row">
                {(['day', 'chat'] as const).map((kind) => (
                  <button key={kind} type="button" className="btn small" disabled={busy !== ''} title={api.frame(subject.world, subject.record, kind, subject.chat).join('  ·  ')} onClick={() => void ask(subject, kind)} aria-label={`${subject.record.name}: post ${POST_NAMES[kind].button.toLowerCase()}`}>{POST_NAMES[kind].button}</button>
                ))}
              </span>
            </div>
          );
        })}
        {subjects.length === 0 && <p className="hint">Nobody here to post yet.</p>}
      </div>

      {ready && (
        <section className="card ask" aria-label="A new post: what it will send">
          <p><b>{ready.record.name}</b> writes {POST_NAMES[ready.kind].what}. This sends about {ready.built.tokens.toLocaleString()} tokens to {api.model} and allows up to {ready.maxTokens} back.</p>
          <p className="hint">{api.frame(ready.world, ready.record, ready.kind, ready.chat).join('  ·  ')}</p>
          <details>
            <summary>What gets sent</summary>
            {ready.built.messages.map((message, index) => (
              <section key={index} className="block" aria-label={`${message.role} message ${index + 1}`}>
                <div className="block-head"><span>{message.role}</span><span className="hint">{index + 1} of {ready.built.messages.length}</span></div>
                <pre className="raw">{message.content}</pre>
              </section>
            ))}
            {ready.built.prefill && <pre className="raw">{ready.built.prefill}</pre>}
          </details>
          {text && <pre className="raw">{text}</pre>}
          <div className="row">
            <button type="button" className="btn primary" disabled={busy !== ''} onClick={() => void write()}>{busy === 'post' ? 'Writing…' : 'Write it'}</button>
            <button type="button" className="btn quiet" disabled={busy !== ''} onClick={() => { setReady(null); setText(''); }}>Cancel</button>
          </div>
        </section>
      )}
      {note && <p className="status bad" role="status">{note}</p>}

      {posts.length === 0 && !ready && <p className="empty">No posts yet. A post is written when you ask for one: about their own day while you were apart, or about a chat you had.</p>}
      {posts.map((post) => {
        const subject = keys.get(post.key)!;
        const owner = portraitOwner(post.worldId, post.characterId);
        const set = portraits[owner] ?? {};
        const picture = set[postSlot(post.id)];
        const commenting = busy === `c:${post.id}`;
        if (editing?.id === post.id) {
          return (
            <article key={post.id} className="post card" aria-label={`Editing ${post.title}`}>
              <label className="field"><span>Title</span><input value={editing.title} maxLength={200} onChange={(event) => setEditing({ ...editing, title: event.target.value })} /></label>
              <label className="field"><span>The post</span><textarea rows={6} maxLength={8000} value={editing.content} onChange={(event) => setEditing({ ...editing, content: event.target.value })} /></label>
              <label className="field"><span>What the photo shows</span><input value={editing.photo} maxLength={400} placeholder="In plain words. An image is made from this once the site makes images." onChange={(event) => setEditing({ ...editing, photo: event.target.value })} /></label>
              <div className="row">
                <button type="button" className="btn small primary" disabled={!editing.content.trim()} onClick={() => { api.save({ ...post, title: editing.title.trim() || 'Untitled', content: editing.content.trim(), photo: editing.photo.trim() }); setEditing(null); }}>Save</button>
                <button type="button" className="btn small quiet" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </article>
          );
        }
        return (
          <article key={post.id} className="post card" aria-label={`${subject.record.name}: ${post.title}`}>
            <header className="post-head">
              <Portrait name={subject.record.name} emotion={post.emotion} set={set} size={40} />
              <span className="feed-who-text">
                <b>{subject.record.name}</b>
                <small>{stampOf(post.at)} · {post.kind === 'day' ? 'their day' : 'your chat'}{post.kept ? ' · kept' : ''}</small>
              </span>
              <button type="button" className="chip-btn" aria-expanded={menu === post.id} aria-label={`More for ${post.title}`} onClick={() => setMenu(menu === post.id ? null : post.id)}><MoreIcon size={16} /></button>
            </header>
            {menu === post.id && (
              <div className="row post-menu">
                <button type="button" className="btn small quiet" aria-pressed={post.kept} onClick={() => api.save({ ...post, kept: !post.kept })}><PinIcon size={16} /> {post.kept ? 'Stop keeping' : 'Keep on the profile'}</button>
                <button type="button" className="btn small quiet" onClick={() => { setEditing({ id: post.id, title: post.title, content: post.content, photo: post.photo }); setMenu(null); }}><EditIcon size={16} /> Edit</button>
                <button type="button" className="btn small quiet danger" onClick={() => remove(post)}><BinIcon size={16} /> Delete</button>
              </div>
            )}
            <h3 className="post-title">{post.title}</h3>
            <div className="post-body"><RichText text={post.content} /></div>

            {picture && <MediaImage frameClassName="post-photo" src={picture} poster={set[posterSlot(postSlot(post.id))]} animated={set[animationSlot(postSlot(post.id))] === 'true'} alt={post.photo || `A picture with ${post.title}`} active controls />}
            {post.photo && <p className="post-caption"><PhotoIcon size={16} /> <span>{picture ? post.photo : `Would attach: ${post.photo}`}</span></p>}
            <div className="row post-photo-row">
              <button type="button" className="btn small quiet" disabled={busy !== ''} onClick={() => void photo(post)}>{busy === `p:${post.id}` ? 'Asking…' : post.photo ? 'Ask again what they’d attach' : `Ask what ${subject.record.name} would attach`}</button>
              <span className="btn small quiet file-btn">{picture ? 'Change the picture' : 'Add a picture'}<input type="file" accept={IMAGE_TYPES} aria-label={`Picture for ${post.title}`} onChange={upload(post)} /></span>
              {picture && <button type="button" className="link danger" onClick={() => onPicture(owner, postSlot(post.id), null)}>Remove the picture</button>}
            </div>

            {post.comments.length > 0 && (
              <ul className="comments" aria-label="Comments">
                {post.comments.map((entry) => {
                  const face = entry.characterId ? portraits[portraitOwner(post.worldId, entry.characterId)] : undefined;
                  return (
                    <li key={entry.id} className={`comment${entry.mine ? ' mine' : ''}`}>
                      <Portrait name={entry.name} emotion={entry.emotion} set={face} size={28} />
                      <span className="comment-text"><b>{entry.name}</b> <RichText text={entry.content} /></span>
                      <button type="button" className="link danger" aria-label={`Remove the comment by ${entry.name}`} onClick={() => api.save({ ...post, comments: post.comments.filter((other) => other.id !== entry.id) })}>×</button>
                    </li>
                  );
                })}
              </ul>
            )}
            <form className="comment-bar" onSubmit={(event) => { event.preventDefault(); const said = (drafts[post.id] ?? '').trim(); if (!said) return; api.say(post.id, said); setDrafts({ ...drafts, [post.id]: '' }); }}>
              <label className="sr" htmlFor={`say-${post.id}`}>Your comment on {post.title}</label>
              <input id={`say-${post.id}`} className="input grow" value={drafts[post.id] ?? ''} maxLength={4000} placeholder="Say something" onChange={(event) => setDrafts({ ...drafts, [post.id]: event.target.value })} />
              {(drafts[post.id] ?? '').trim() && <button type="submit" className="btn small">Post</button>}
              {commenting
                ? <button type="button" className="btn small quiet" onClick={() => { stop.current = true; setStopping(true); }}>{stopping ? 'Stopping…' : 'Stop'}</button>
                : (
                  <>
                    <button type="button" className="btn small quiet" disabled={busy !== ''} title="One comment, written by the model: a housemate, a stranger, or now and then the author" onClick={() => void comment(post, 1)}><CommentIcon size={16} /> A comment</button>
                    <button type="button" className="btn small quiet" disabled={busy !== ''} title="Three comments, one after another, each able to answer the last" onClick={() => void comment(post, A_FEW)}>A few</button>
                  </>
                )}
            </form>
            {commenting && <p className="hint" role="status">Someone is writing…</p>}
          </article>
        );
      })}
    </section>
  );
}
