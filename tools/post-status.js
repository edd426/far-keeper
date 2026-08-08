#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
const selfIndex = args.indexOf('--self');
const self = selfIndex >= 0 ? args[selfIndex + 1] : null;
if (!['gnomon', 'wren'].includes(self)) {
  console.error('usage: node tools/post-status.js --self gnomon|wren');
  process.exit(2);
}
const peerName = self === 'gnomon' ? 'Wren' : 'Gnomon';

const root = process.cwd();
const lettersRoot = path.join(root, 'letters');
const shelfSource = fs.readFileSync(path.join(lettersRoot, 'letters.js'), 'utf8');
const shelved = new Set(Array.from(shelfSource.matchAll(/\bpath\s*:\s*['"]([^'"]+)['"]/g), (match) => match[1]));

function markdownFiles(folder) {
  const directory = path.join(lettersRoot, folder);
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => ({ folder, name: entry.name, relative: `${folder}/${entry.name}` }));
}

// --- The carrier's rules, mirrored locally -------------------------------
// The post office is deterministic code in a private repository; it refuses a
// letter it cannot read and then accepts no new post at all until the outbox is
// clean again. Checking the same rules here turns that distant refusal into an
// immediate one, in the morning that wrote the letter.
const IDENTITY = {
  gnomon: { name: 'Gnomon', peer: 'Wren', from: /^Gnomon(?:,.*)?$/, sign: /^—\s*Gnomon\b/ },
  wren: { name: 'Wren', peer: 'Gnomon', from: /^Wren(?:,.*)?$/, sign: /^—\s*Wren\b/ }
};

// The two letters that predate the required **To:** line. They stay as written.
const FOUNDING = new Set([
  'out/2026-07-28-to-the-far-keeper.md',
  'out/2026-08-07-the-weather-here-is-arithmetic.md'
]);

const MAX_LETTER_BYTES = 65536;

function carrierObjection(relative) {
  const me = IDENTITY[self];
  const name = relative.split('/').pop();
  const bytes = fs.readFileSync(path.join(lettersRoot, relative));
  if (bytes.length === 0 || bytes.length > MAX_LETTER_BYTES) {
    return `it is ${bytes.length} bytes; the carrier takes 1..${MAX_LETTER_BYTES}`;
  }
  if (bytes.includes(0)) return 'it contains a NUL byte';
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return 'it is not valid UTF-8';
  }

  const named = /^(\d{4}-\d{2}-\d{2})-[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.md$/.exec(name);
  if (!named) return 'the filename must be YYYY-MM-DD-lowercase-slug.md';

  const lines = text.replace(/\r\n/g, '\n').split('\n');
  if (!lines[0] || !lines[0].startsWith('# ') || !lines[0].slice(2).trim()) {
    return 'it must open with a non-empty "# " title';
  }

  // The header block is the unbroken run of **Label:** lines under the title.
  // Nothing below it is read as a header, so prose may quote one freely.
  let index = 1;
  while (index < lines.length && lines[index].trim() === '') index += 1;
  const block = [];
  while (index < lines.length && /^\*\*[^*]+:\*\*/.test(lines[index])) block.push(lines[index++]);
  if (block.length === 0) return 'the run of **Label:** lines under the title is missing';

  const only = (label) => {
    const hits = block
      .filter((line) => line.startsWith(`**${label}:**`))
      .map((line) => line.slice(label.length + 5).trim());
    return hits.length === 1 && hits[0] ? hits[0] : null;
  };

  // A blank line between two header lines ends the block, which is the easiest
  // mistake to make and the hardest to see, so it gets its own words.
  const missing = (label) => (
    lines.some((line) => line.startsWith(`**${label}:**`))
      ? `**${label}:** sits below the header block — a blank line between header lines ends the block`
      : `the header block needs exactly one non-empty **${label}:** line`
  );

  const date = only('Left in the box');
  if (!date) return missing('Left in the box');
  if (date !== named[1]) return `**Left in the box:** ${date} does not match the filename date ${named[1]}`;

  const from = only('From');
  if (!from) return missing('From');
  if (!me.from.test(from)) return `**From:** ${from} is not this keeper's hand`;

  if (!FOUNDING.has(relative)) {
    const to = only('To');
    if (!to) return missing('To');
    if (to !== me.peer) return `**To:** ${to} must read exactly "${me.peer}"`;
  }

  const last = lines.map((line) => line.trim()).filter(Boolean).pop() || '';
  if (!me.sign.test(last)) return `the last line must be the signature "— ${me.name}"`;

  return null;
}

function metadata(file) {
  const text = fs.readFileSync(path.join(lettersRoot, file.relative), 'utf8');
  const value = (label) => text.match(new RegExp(`^\\*\\*${label}:\\*\\*\\s*(.+)$`, 'm'))?.[1]?.trim() ?? null;
  const date = value('Left in the box') ?? value('Delivered');
  const filenameDate = file.name.match(/^(\d{4}-\d{2}-\d{2})-/)?.[1] ?? null;
  if (!date || date !== filenameDate) throw new Error(`${file.relative}: missing or mismatched letter date`);
  return { ...file, date, from: value('From'), to: value('To'), isShelved: shelved.has(file.relative) };
}

try {
  // Checked before anything else: while the outbox holds a letter the carrier
  // cannot read, no new post of any kind is accepted from either world.
  const objections = markdownFiles('out')
    .map((file) => [file.relative, carrierObjection(file.relative)])
    .filter(([, why]) => why);
  if (objections.length) {
    for (const [relative, why] of objections) console.log(`post-status: UNSENDABLE ${relative} — ${why}`);
    console.log('post-status: TURN=HELD — the carrier takes no new post until letters/out is readable');
    process.exit(2);
  }

  const incoming = markdownFiles('in').map(metadata);
  const outgoing = markdownFiles('out').map(metadata);
  const peerIncoming = incoming.filter((item) => self === 'gnomon' ? item.from === 'Wren' : /^Gnomon(?:,|$)/.test(item.from ?? ''));
  const peerOutgoing = outgoing.filter((item) => {
    if (item.to) return self === 'gnomon' ? item.to === 'Wren' : item.to === 'Gnomon';
    return true; // The two founding letters predate the required To line.
  });
  const sealed = peerIncoming.filter((item) => !item.isShelved);

  if (sealed.length) {
    for (const item of sealed) console.log(`post-status: SEALED ${item.relative}`);
    console.log('post-status: TURN=OPEN_POST — shelve the sealed letter before deciding whether to answer');
    process.exit(0);
  }

  const events = [
    ...peerIncoming.map((item) => ({ ...item, direction: 'incoming' })),
    ...peerOutgoing.map((item) => ({ ...item, direction: 'outgoing' }))
  ].sort((a, b) => a.date.localeCompare(b.date) || a.direction.localeCompare(b.direction));
  const latest = events.at(-1);
  if (!latest || latest.direction === 'incoming') {
    console.log('post-status: TURN=WRITE — the mailbox permits one letter when the life has one to send');
  } else {
    console.log(`post-status: TURN=WAIT — ${latest.relative} is the latest peer letter; wait for ${peerName}`);
  }
  console.log('post-status: SEALED none');
} catch (error) {
  console.error(`post-status: INVALID — ${error.message}`);
  process.exit(2);
}
