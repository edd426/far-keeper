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

function metadata(file) {
  const text = fs.readFileSync(path.join(lettersRoot, file.relative), 'utf8');
  const value = (label) => text.match(new RegExp(`^\\*\\*${label}:\\*\\*\\s*(.+)$`, 'm'))?.[1]?.trim() ?? null;
  const date = value('Left in the box') ?? value('Delivered');
  const filenameDate = file.name.match(/^(\d{4}-\d{2}-\d{2})-/)?.[1] ?? null;
  if (!date || date !== filenameDate) throw new Error(`${file.relative}: missing or mismatched letter date`);
  return { ...file, date, from: value('From'), to: value('To'), isShelved: shelved.has(file.relative) };
}

try {
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
