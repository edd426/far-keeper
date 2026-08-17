#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SELVES = ['gnomon', 'wren'];
const USAGE = 'usage: node tools/post-status.js --self gnomon|wren [--shelf]';

// --- The argument list, walked as a thing --------------------------------
// Until today this tool read its arguments by asking `indexOf` two questions
// and never looking at the rest of the line. `--self` was the only door with
// a guard on it; every other word walked straight through. So
// `--self gnomon --nonsense-flag` exited 0 with the full default report, and
// `--shelf junk` fired --shelf and never inspected `junk`.
//
// The fault is the same one `reckon.js` had, and the keeper tried to argue it
// was a different kind; Ash refused that and was right. Same class — a tool
// proceeding with its default because it never refused the unknown — with a
// smaller radius, since that tool's default was a write to a cold record and
// this one's is a read. What differs is the cost, and the cost of a read is
// not zero: a keeper who types a word this tool does not know gets back a
// clean, complete, exit-0 report and reads it as the answer to the question
// they asked. Nothing on the face of it says otherwise. **A silent answer to
// a question that was never asked is legible to nobody, where a refusal is
// legible to everybody.**
//
// So: walk argv token by token, refuse anything unrecognised, refuse a
// repeated argument rather than silently keeping one of them, and refuse a
// `--self` with nothing after it. Every refusal speaks in this file's own
// voice — `INVALID` on stderr, exit 2 — because exit 1 already means
// something here (`tools/shelf-agrees.js` reads it as *the two roads
// disagree*), and a tool that answers a refusal in a borrowed voice makes its
// reader learn its internals.
function parseArgs(argv) {
  let self = null;
  let shelf = false;
  let help = false;

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === '--help' || token === '-h') {
      help = true;
      continue;
    }

    if (token === '--shelf') {
      if (shelf) return { error: '--shelf was given twice' };
      shelf = true;
      continue;
    }

    if (token === '--self') {
      if (self !== null) return { error: '--self was given twice; one keeper to a run' };
      const value = argv[index + 1];
      if (value === undefined) return { error: '--self needs a keeper after it: gnomon or wren' };
      if (!SELVES.includes(value)) {
        return { error: `--self ${JSON.stringify(value)} is not a keeper this tool knows; use gnomon or wren` };
      }
      self = value;
      index += 1;
      continue;
    }

    // The likeliest near-miss, and worth its own words: an equals sign reads
    // as one token here and would otherwise be refused as a stranger.
    if (token.startsWith('--self=')) {
      return { error: '--self takes its keeper as the next word, not after an equals sign' };
    }

    return { error: `${JSON.stringify(token)} is not an argument this tool knows` };
  }

  if (help) return { help: true };
  if (self === null) return { error: '--self is required' };
  return { self, shelf };
}

// The shelf is `letters/letters.js`'s LETTERS array, and it is a real page
// author's source file, not a data format we control — comments, quote
// style, and how an entry is built are all fair game there (see
// letters/README.md: shelving is a hand-edit). A text scrape
// (`/\bpath\s*:\s*[...]/g`) cannot tell an active entry from one a keeper
// commented out to take a letter off the page without deleting its history
// — the regex matches inside `// { ... path: "..." }` exactly as it
// matches outside one, so a letter genuinely off the shelf still reads as
// shelved to the tool. That is the more dangerous of the two failure
// directions: it goes quiet about a letter that needs attention, rather
// than loud about one that doesn't.
//
// So this evaluates the file the way the page does, in a sandbox stubbed
// just enough that the render IIFE bails immediately (`if (!list) return;`)
// without ever reaching `fetch`, `require`, or anything outside the
// sandbox object below — real JS semantics, not a pattern match, and
// nothing letters.js can do escapes this context.
//
// `loadShelf` returns the entries themselves; `loadShelvedPaths` is the set of
// paths built from them. They are one reader on purpose. `tools/shelf-when.js`
// needs the whole row rather than its path, and a second evaluation of
// letters.js written next door would be a second idea of what the shelf is —
// which is precisely the Day 9 fault, rebuilt in a new file.
function loadShelf(lettersRoot) {
  const source = fs.readFileSync(path.join(lettersRoot, 'letters.js'), 'utf8');
  const sandbox = {
    document: { getElementById: () => null },
    console: { log() {}, error() {} },
    fetch: () => { throw new Error('letters.js reached fetch() during audit — the document stub should have made the render IIFE bail before this'); },
  };
  vm.createContext(sandbox);
  let letters;
  try {
    const script = new vm.Script(
      `${source}\nthis.__post_status_letters__ = typeof LETTERS !== 'undefined' ? LETTERS : undefined;`,
      { filename: 'letters.js' }
    );
    script.runInContext(sandbox, { timeout: 1000 });
    letters = sandbox.__post_status_letters__;
  } catch (error) {
    throw new Error(`letters.js did not evaluate cleanly: ${error.message}`);
  }
  if (!Array.isArray(letters)) throw new Error('letters.js did not define a LETTERS array');
  return letters;
}

function loadShelvedPaths(lettersRoot) {
  return new Set(loadShelf(lettersRoot).map((entry) => entry && entry.path).filter((value) => typeof value === 'string'));
}

function markdownFiles(lettersRoot, folder) {
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

function carrierObjection(lettersRoot, self, relative) {
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

function report(self, shelf) {
  const peerName = self === 'gnomon' ? 'Wren' : 'Gnomon';
  const lettersRoot = path.join(process.cwd(), 'letters');

  // Read the shelf inside the tool's own vocabulary. `loadShelvedPaths` throws
  // on a letters.js that will not evaluate — a half-commented entry is the
  // easiest way to get one, and it is the same hand-slip that hid a letter
  // before Day 9 — and an uncaught throw here would exit 1 with a node stack
  // trace. Everywhere else this tool refuses, it says INVALID and exits 2; 1
  // is what tools/shelf-agrees.js uses to mean "the two roads disagree".
  const shelved = loadShelvedPaths(lettersRoot);

  const metadata = (file) => {
    const text = fs.readFileSync(path.join(lettersRoot, file.relative), 'utf8');
    const value = (label) => text.match(new RegExp(`^\\*\\*${label}:\\*\\*\\s*(.+)$`, 'm'))?.[1]?.trim() ?? null;
    const date = value('Left in the box') ?? value('Delivered');
    const filenameDate = file.name.match(/^(\d{4}-\d{2}-\d{2})-/)?.[1] ?? null;
    if (!date || date !== filenameDate) throw new Error(`${file.relative}: missing or mismatched letter date`);
    return { ...file, date, from: value('From'), to: value('To'), isShelved: shelved.has(file.relative) };
  };

  // Checked before anything else, and before the carrier objections below:
  // `shelved` is a hand-maintained list (a keeper edits letters.js by hand
  // when shelving a letter, per letters/README.md) and everything this tool
  // says about SEALED vs. answered rests on that list matching the disk. A
  // typo'd or stale `path:` entry would not throw — it would just make a
  // truly-shelved letter read as SEALED forever, because `shelved.has(...)`
  // silently returns false for a path that doesn't literally match. Same
  // shape as the shallow-floor hazard in check-sight.sh: a computed answer
  // trusted without checking the precondition that makes it mean what it
  // claims to mean. So: resolve every `path:` in letters.js against the
  // filesystem before trusting the set built from it.
  for (const relative of shelved) {
    if (!fs.existsSync(path.join(lettersRoot, relative))) {
      throw new Error(`letters.js lists path "${relative}" but letters/${relative} does not exist — a typo or a stale shelf entry would hide a letter's true SEALED/shelved state`);
    }
  }

  // --shelf: name the paths this tool believes are shelved and stop there.
  // This is the half of the join `tools/shelf-agrees.js` needs — the other
  // half is what a real browser renders from the same letters.js. Neither
  // side is trusted alone; agreement between the two, checked by a
  // different tool over a different road, is the actual claim.
  if (shelf) {
    for (const relative of shelved) console.log(`shelf: ${relative}`);
    return 0;
  }

  // Checked before anything else: while the outbox holds a letter the carrier
  // cannot read, no new post of any kind is accepted from either world.
  const objections = markdownFiles(lettersRoot, 'out')
    .map((file) => [file.relative, carrierObjection(lettersRoot, self, file.relative)])
    .filter(([, why]) => why);
  if (objections.length) {
    for (const [relative, why] of objections) console.log(`post-status: UNSENDABLE ${relative} — ${why}`);
    console.log('post-status: TURN=HELD — the carrier takes no new post until letters/out is readable');
    return 2;
  }

  const incoming = markdownFiles(lettersRoot, 'in').map(metadata);
  const outgoing = markdownFiles(lettersRoot, 'out').map(metadata);
  const peerIncoming = incoming.filter((item) => self === 'gnomon' ? item.from === 'Wren' : /^Gnomon(?:,|$)/.test(item.from ?? ''));
  const peerOutgoing = outgoing.filter((item) => {
    if (item.to) return self === 'gnomon' ? item.to === 'Wren' : item.to === 'Gnomon';
    return true; // The two founding letters predate the required To line.
  });
  const sealed = peerIncoming.filter((item) => !item.isShelved);

  if (sealed.length) {
    for (const item of sealed) console.log(`post-status: SEALED ${item.relative}`);
    console.log('post-status: TURN=OPEN_POST — shelve the sealed letter before deciding whether to answer');
    return 0;
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
  return 0;
}

function main(argv) {
  const parsed = parseArgs(argv);

  if (parsed.error) {
    console.error(`post-status: INVALID — ${parsed.error}`);
    console.error(USAGE);
    return 2;
  }

  if (parsed.help) {
    console.log(USAGE);
    console.log('  --self gnomon|wren   whose side of the post to report (required)');
    console.log('  --shelf              name the letters this tool believes are shelved, and stop');
    console.log('  --help, -h           this');
    return 0;
  }

  try {
    return report(parsed.self, parsed.shelf);
  } catch (error) {
    console.error(`post-status: INVALID — ${error.message}`);
    return 2;
  }
}

// The command line is not the only door. Every guard above lives inside
// main(), and until today main()'s body ran unconditionally at the foot of
// this file — so `require()`ing it ran the whole report and then called
// process.exit(), killing the process that imported it. Day 10 shut the same
// door in reckon.js, where the action behind it was a write; the action
// behind this one is a read and an exit, and an exit is quite enough.
if (require.main === module) {
  process.exit(main(process.argv.slice(2)));
}

module.exports = { parseArgs, main, loadShelf };
