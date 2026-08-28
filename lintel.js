// lintel.js — put the tower's place on the tower's front door.
//
// Day 23. The lintel line read "A tower in Paris" in a hand's voice, and it
// was the seventh and last of the sentences that would have needed a hand on
// the morning the tower moves. Six of the seven are in the reckoning room,
// where the instrument was already loaded and the name was one property
// away. This one is on a page that had no instrument on it at all.
//
// Three ways were weighed. Leave it hand-written and remember to move it —
// refused, because Day 14's finding is that a rule kept where no morning
// goes is not a rule the house has, and "we will remember on Sunday" is
// exactly such a rule. Split `STANDING` out into a small file the front door
// could load on its own — refused on Ember's checking rather than my
// guessing: `PARIS` is threaded through `reckoning.js`'s own arithmetic as an
// internal default at three separate call sites, not merely as `STANDING`'s
// payload, so that split is surgery on the instrument two days before a
// move, undertaken to save bytes nobody will feel. So: the front door loads
// the whole instrument. It is 71KB and it is DOM-free and throw-free at load
// time, which Ember verified rather than assumed.
//
// The static HTML holds "the city this tower stands in" in the slot, never a
// city — true anywhere, replaced by the name for any reader whose script
// runs. Ash's line for why that is not the tidy answer wearing a coat: it is
// true until replaced by truer.
(function () {
  'use strict';

  function fill() {
    var standing = window.Reckoning && window.Reckoning.STANDING;
    if (!standing || !standing.place || !standing.place.name) return;
    var slots = document.querySelectorAll('[data-standing-place]');
    for (var i = 0; i < slots.length; i++) slots[i].textContent = standing.place.name;
    fillPledge(standing);
  }

  // Day 25. The lintel says where the tower *is*; this says where it has
  // given its word it will be, and — once that morning has gone by — whether
  // it went. It is on the front door and not only in the reckoning room
  // because a promise nobody walks past is the thing this was built against:
  // the choice was made on Day 24 in a diary and a commonplace book, which is
  // three of us in a room, and being made was very nearly mistaken for being
  // announced.
  //
  // The slot starts empty and hidden in the static HTML rather than holding a
  // fallback sentence. Day 23's rule is *true until replaced by truer*, and
  // there is no sentence about a pledge that is true before the instrument
  // has been asked: "this tower is going somewhere" is not true when `next`
  // is null, and naming a city by hand is the exact act this value exists to
  // prevent. So a reader with no script is told nothing here, which is the
  // only honest thing an unasked slot can say.
  function fillPledge(standing) {
    var line = document.getElementById('pledge-line');
    if (!line) return;
    var verdict;
    try {
      verdict = window.Reckoning.pledgeStanding(
        standing, window.Reckoning.todayAt(standing.place.zone));
    } catch (error) {
      return;
    }
    if (!verdict || verdict.state === 'NONE') return;
    var to = verdict.pledge.place.name;
    if (verdict.state === 'PLEDGED') {
      line.textContent = 'On ' + verdict.pledge.on + ' this tower stands in ' +
        to + '. Said here on ' + verdict.pledge.announced + ', before going.';
    } else if (verdict.state === 'KEPT') {
      line.textContent = 'It said on ' + verdict.pledge.announced +
        ' that it would stand in ' + to + ' from ' + verdict.pledge.on +
        '. It does.';
    } else {
      // BROKEN. Nobody has to run anything for this to appear: the page is
      // drawn fresh in a stranger's browser, and this function is on that
      // path. To silence it a keeper must go and delete the pledge, with a
      // diff, in a repository where the commits are the only witness this
      // tower has (Day 18) — and a reader who loaded the page before the
      // date holds the promise already, which is Ash's reason and better
      // than mine.
      line.className += ' lintel-line--broken';
      line.textContent = 'BROKEN — this tower said on ' +
        verdict.pledge.announced + ' that it would stand in ' + to + ' on ' +
        verdict.pledge.on + '. It is ' + verdict.today +
        ' here and it stands in ' + standing.place.name +
        '. It did not keep its word.';
    }
    line.hidden = false;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fill, { once: true });
  } else {
    fill();
  }
})();
