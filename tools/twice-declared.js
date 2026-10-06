#!/usr/bin/env node
'use strict';
//
// Twice declared — Day 64.
//
//   node tools/twice-declared.js              check the working tree
//   node tools/twice-declared.js <tree>       check another copy of the tower
//   node tools/twice-declared.js --help       the surface, in one line
//
// **The question.** Does any script this tower serves declare one name twice
// in one scope, so that one of the two declarations is silently not the one
// that runs?
//
// **Why, and it was named on Day 61 and not built.** `reckoning/page.js`
// declared `function signedSeconds` twice. The first took seconds; the
// second, added with the almanac on 2026-10-01, took minutes. A function
// declared twice in one scope is one function, the later one, so for three
// days six figures on the page were printed sixty times too large (+4233 s
// for +70.6). The file parsed. Every line that was edited was right. Nothing
// that runs daily loads the page. `parses.sh` cannot see it, because it is
// not a syntax error; it is two correct lines that cannot both be true.
//
// **A parser, never a regex.** A regex does not know what a comment is (Day
// 9, Day 45) or what a string is. The names come off a real syntax tree:
// TypeScript's `createSourceFile`, which is installed globally on this desk
// and not in the repository. So this tool is only as good as the desk it
// runs on, and it says so: the parser's version and path are printed on
// every run, and **a parser that cannot be loaded is UNCLEAR, exit 2, never
// an all-clear.** `FAR_KEEPER_TS_PATH` names the parser by hand (the break
// suite uses it to point at nowhere).
//
// **The case list is the HTML.** Every `<script src>` in every page, as
// `parses.sh` finds them, so a script added to a page is covered the morning
// it is added. Inline `<script>` blocks are not read; there are none today,
// and one appearing is reported as UNCLEAR rather than passed over.
//
// **Two scopes, and the second is Ember's.** Inside one file, each function
// is a scope: `var`, `function` and parameters belong to the nearest
// function. A function declared inside a nested block is treated as
// belonging to that block, which is what strict mode does (every page script
// here but `letters.js` says 'use strict'; that file declares no function in
// a block). And **the scripts one page loads share one global scope**:
// a top-level `function f` in one file and another in the next is the same
// fault across a file boundary, and a top-level `const` in one with any
// declaration of the name in the next stops the later script running at
// all. `parses.sh` checks files one at a time and can see neither.
//
// **The words, and they fork (Day 11).**
//   DOUBLED     a pair where one declaration silently is not the one that
//               runs, or where the later script throws: any pair with a
//               `function` in it, or any top-level `let`/`const`/`class`
//               met again across two files of one page. exit 1.
//   REDECLARED  `var` with `var`, or a parameter with a `var`: legal, and
//               it changes nothing a call does. Printed and counted, never
//               an alarm, because an alarm on every morning is one a keeper
//               stops reading.
//   UNCLEAR     the parser would not load, a page script was missing and
//               not a declared build artifact, an inline script appeared,
//               or nothing at all was walked. exit 2.
//   UNBUILT     a script the tree ignores and has not built (`build-sha.js`
//               on a fresh clone). Not a fault, and the line says the page's
//               shared scope was checked without it.
// Bad flag: exit 3, so a typo spends no verdict.
//
// **Ash's word was SHADOWED, and it is refused, on the meaning.** Shadowing
// is an inner scope hiding an outer name, and that is exactly the case this
// tool must stay quiet about: `var x` inside two different functions is
// fine. The fault is not one name hiding another; it is two declarations
// where only one survives. *Doubled* says that.
//
// **What it does not see, and this is on its face.** Assignments are not
// declarations: `root.Reckoning = …` twice, or `window.x` written by two
// scripts, is invisible here. So is a name declared once and meant to be two
// things. `let`/`const` doubled inside one file is a SyntaxError and belongs
// to `parses.sh`. And Ash's half, which no code can answer: a check nobody
// runs is not a guard. This one is reached by its break suite on Sundays,
// and by a keeper's hand before any push that touches a page script.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const USAGE = 'usage: node tools/twice-declared.js [tree] | --help';

function main(argv) {
  const args = argv.slice(2);
  let tree = null;
  for (const a of args) {
    if (a === '--help' || a === '-h') { console.log(USAGE); return 0; }
    if (a.startsWith('-')) {
      console.error('twice-declared: INVALID — unknown flag ' + a);
      console.error(USAGE);
      return 3;
    }
    if (tree !== null) {
      console.error('twice-declared: INVALID — one tree at most');
      console.error(USAGE);
      return 3;
    }
    tree = a;
  }
  tree = path.resolve(tree || path.join(__dirname, '..'));
  if (!fs.existsSync(tree) || !fs.statSync(tree).isDirectory()) {
    console.error('twice-declared: UNCLEAR — ' + tree + ' is not a directory');
    return 2;
  }

  const parser = loadParser();
  if (!parser.ts) {
    console.error('twice-declared: UNCLEAR — no parser: ' + parser.why);
    console.error('twice-declared: nothing was read, so nothing is cleared.');
    return 2;
  }
  const ts = parser.ts;
  console.log('twice-declared: parser typescript ' + ts.version + ' from ' + parser.from);

  const pages = findPages(tree);
  if (pages.length === 0) {
    console.error('twice-declared: UNCLEAR — no HTML found under ' + tree);
    return 2;
  }

  let doubled = 0, redeclared = 0, unclear = 0, unbuilt = 0;
  let filesWalked = 0, scopesWalked = 0, declsSeen = 0;
  const parsed = new Map();   // rel -> { top: [...decl], err }

  function readScript(rel) {
    if (parsed.has(rel)) return parsed.get(rel);
    const text = fs.readFileSync(path.join(tree, rel), 'utf8');
    const sf = ts.createSourceFile(rel, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
    const out = walkFile(ts, sf);
    filesWalked += 1;
    scopesWalked += out.scopes;
    declsSeen += out.decls;
    for (const f of out.findings) {
      if (f.verdict === 'DOUBLED') doubled += 1; else redeclared += 1;
      console.log('twice-declared: ' + f.verdict + ' — ' + rel + ': `' + f.name + '` ' +
        f.first.kind + ' at line ' + f.first.line + ', ' + f.second.kind +
        ' at line ' + f.second.line + ' (' + f.where + ')' +
        (f.verdict === 'DOUBLED' ? ' — ' + why(f) : ''));
    }
    const rec = { top: out.top };
    parsed.set(rel, rec);
    return rec;
  }

  for (const page of pages) {
    const html = fs.readFileSync(path.join(tree, page), 'utf8');
    const tags = html.match(/<script\b[^>]*>/g) || [];
    const loaded = [];
    for (const tag of tags) {
      const m = tag.match(/\bsrc\s*=\s*["']([^"']+)["']/);
      if (!m) {
        console.log('twice-declared: UNCLEAR — ' + page + ' has an inline <script>, which this tool does not read');
        unclear += 1;
        continue;
      }
      const src = m[1];
      if (/^(https?:)?\/\//.test(src)) {
        console.log('twice-declared: ' + page + ' loads ' + src + ' from off this tower — not read');
        continue;
      }
      const rel = path.normalize(path.join(path.dirname(page), src));
      if (!fs.existsSync(path.join(tree, rel))) {
        if (gitIgnores(tree, rel)) {
          console.log('twice-declared: UNBUILT — ' + page + ' loads ' + rel +
            ', which this tree ignores and has not built; its shared scope was checked without it');
          unbuilt += 1;
        } else {
          console.log('twice-declared: UNCLEAR — ' + page + ' loads ' + rel + ', and there is no such file');
          unclear += 1;
        }
        continue;
      }
      loaded.push({ rel, rec: readScript(rel) });
    }
    // The page's shared global scope, in load order.
    const seen = new Map();
    for (const { rel, rec } of loaded) {
      for (const d of rec.top) {
        const prior = seen.get(d.name);
        if (prior && prior.rel !== rel) {
          const verdict = (isFn(prior.kind) || isFn(d.kind) || isLexical(prior.kind) || isLexical(d.kind))
            ? 'DOUBLED' : 'REDECLARED';
          if (verdict === 'DOUBLED') doubled += 1; else redeclared += 1;
          const f = { name: d.name, first: prior, second: d, verdict };
          console.log('twice-declared: ' + verdict + ' — ' + page + ' shares one global scope: `' +
            d.name + '` ' + prior.kind + ' in ' + prior.rel + ':' + prior.line + ', ' +
            d.kind + ' in ' + rel + ':' + d.line +
            (verdict === 'DOUBLED' ? ' — ' + why(f) : ''));
        }
        if (!prior) seen.set(d.name, Object.assign({ rel }, d));
      }
    }
  }

  console.log('twice-declared: walked ' + filesWalked + ' script' + (filesWalked === 1 ? '' : 's') + ' from ' + pages.length +
    ' pages — ' + scopesWalked + ' scopes, ' + declsSeen + ' declarations');

  if (filesWalked === 0 || declsSeen === 0) {
    // An empty domain always says yes (Day 27). Nothing walked is not clean.
    console.error('twice-declared: UNCLEAR — nothing was walked, so nothing is cleared');
    return 2;
  }
  if (doubled > 0) {
    console.log('twice-declared: DOUBLED — ' + doubled + ' name' + (doubled === 1 ? '' : 's') +
      ' declared twice where only one can be the one that runs.');
    return 1;
  }
  if (unclear > 0) {
    console.error('twice-declared: UNCLEAR — ' + unclear + ' thing' + (unclear === 1 ? '' : 's') +
      ' could not be read; no all-clear.');
    return 2;
  }
  console.log('twice-declared: CLEAR — no name doubled in any scope walked' +
    (redeclared ? ', and ' + redeclared + ' harmless var redeclared' : '') +
    (unbuilt ? '; ' + unbuilt + ' unbuilt script' + (unbuilt === 1 ? '' : 's') + ' not read' : '') + '.');
  return 0;
}

function isFn(kind) { return kind === 'function'; }
function isLexical(kind) { return kind === 'let' || kind === 'const' || kind === 'class'; }

function why(f) {
  if (isLexical(f.first.kind) || isLexical(f.second.kind)) {
    return 'the later script throws when it loads, and runs nothing';
  }
  if (isFn(f.first.kind) && isFn(f.second.kind)) {
    return 'only the later one exists; every call reaches it';
  }
  return 'the function and the other declaration are one binding, and whichever is assigned last wins';
}

function loadParser() {
  const tried = [];
  const named = process.env.FAR_KEEPER_TS_PATH;
  const candidates = [];
  if (named) {
    candidates.push(named);
  } else {
    candidates.push('typescript');
    try {
      const root = execFileSync('npm', ['root', '-g'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      if (root) candidates.push(path.join(root, 'typescript'));
    } catch (e) {
      tried.push('npm root -g failed');
    }
  }
  for (const c of candidates) {
    try {
      const from = require.resolve(c);
      const ts = require(from);
      if (typeof ts.createSourceFile !== 'function') { tried.push(c + ' has no createSourceFile'); continue; }
      return { ts, from };
    } catch (e) {
      tried.push(c + ' would not load');
    }
  }
  return { ts: null, why: tried.join('; ') || 'nothing to try' };
}

function findPages(tree) {
  const out = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(path.join(tree, dir), { withFileTypes: true })) {
      if (e.name === '.git' || e.name === 'node_modules') continue;
      const rel = dir ? path.join(dir, e.name) : e.name;
      if (e.isDirectory()) walk(rel);
      else if (e.name.endsWith('.html')) out.push(rel);
    }
  })('');
  return out.sort();
}

function gitIgnores(tree, rel) {
  try {
    execFileSync('git', ['-C', tree, 'check-ignore', '-q', rel], { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

// Walk one file. Returns findings within the file, its top-level
// declarations (for the page's shared scope), and how much it walked.
function walkFile(ts, sf) {
  const findings = [];
  let scopes = 0, decls = 0;
  const top = [];

  function lineOf(node) {
    return sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
  }

  function newScope(where) { scopes += 1; return { where, names: new Map() }; }

  function declare(scope, name, kind, node) {
    decls += 1;
    const d = { name, kind, line: lineOf(node) };
    if (scope.where === 'top level') top.push(d);
    const prior = scope.names.get(name);
    if (!prior) { scope.names.set(name, d); return; }
    // let/const/class doubled in one scope is a SyntaxError: parses.sh's.
    if (isLexical(prior.kind) || isLexical(kind)) return;
    if (prior.kind === 'param' && kind === 'param') return;
    const verdict = (isFn(prior.kind) || isFn(kind)) ? 'DOUBLED' : 'REDECLARED';
    findings.push({ name, first: prior, second: d, verdict, where: scope.where });
    scope.names.set(name, d);
  }

  function bindingNames(name, cb) {
    if (!name) return;
    if (ts.isIdentifier(name)) { cb(name.text, name); return; }
    if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
      for (const el of name.elements) {
        if (ts.isBindingElement(el)) bindingNames(el.name, cb);
      }
    }
  }

  function fnLabel(node) {
    if (node.name && ts.isIdentifier(node.name)) return 'function ' + node.name.text;
    return 'function at line ' + lineOf(node);
  }

  function isFunctionLike(node) {
    return ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) || ts.isMethodDeclaration(node) ||
      ts.isConstructorDeclaration(node) || ts.isGetAccessorDeclaration(node) ||
      ts.isSetAccessorDeclaration(node);
  }

  // fnScope: where var/function/params go. blockScope: where let/const/class
  // and block-level functions go.
  function visit(node, fnScope, blockScope) {
    if (ts.isFunctionDeclaration(node)) {
      if (node.name) declare(blockScope, node.name.text, 'function', node);
      enterFunction(node);
      return;
    }
    if (isFunctionLike(node)) { enterFunction(node); return; }
    if (ts.isClassDeclaration(node) && node.name) {
      declare(blockScope, node.name.text, 'class', node);
    }
    if (ts.isVariableDeclarationList(node)) {
      const flags = node.flags;
      const kind = (flags & ts.NodeFlags.Const) ? 'const' : (flags & ts.NodeFlags.Let) ? 'let' : 'var';
      const target = kind === 'var' ? fnScope : blockScope;
      for (const d of node.declarations) bindingNames(d.name, (n, at) => declare(target, n, kind, at));
    }
    if (ts.isBlock(node) || ts.isForStatement(node) || ts.isForInStatement(node) ||
        ts.isForOfStatement(node) || ts.isCaseBlock(node)) {
      const inner = newScope(blockScope.where + ', block at line ' + lineOf(node));
      ts.forEachChild(node, (c) => visit(c, fnScope, inner));
      return;
    }
    if (ts.isCatchClause(node)) {
      const inner = newScope(blockScope.where + ', catch at line ' + lineOf(node));
      ts.forEachChild(node, (c) => visit(c, fnScope, inner));
      return;
    }
    ts.forEachChild(node, (c) => visit(c, fnScope, blockScope));
  }

  function enterFunction(node) {
    const scope = newScope(fnLabel(node));
    for (const p of node.parameters || []) {
      bindingNames(p.name, (n, at) => declare(scope, n, 'param', at));
      if (p.initializer) visit(p.initializer, scope, scope);
    }
    const body = node.body;
    if (!body) return;
    if (ts.isBlock(body)) {
      // The body block is the function's own scope, not a nested block.
      ts.forEachChild(body, (c) => visit(c, scope, scope));
    } else {
      visit(body, scope, scope);
    }
  }

  const topScope = newScope('top level');
  ts.forEachChild(sf, (c) => visit(c, topScope, topScope));
  return { findings, top, scopes, decls };
}

if (require.main === module) {
  process.exitCode = main(process.argv);
}

module.exports = { main };
