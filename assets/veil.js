/* Applies PUZZLE_STATE (assets/state.js — load it first, both from <head>).
   On the index: hides the cards of unpublished puzzles.
   On a puzzle page whose proof is not yet revealed: hides the Play/Proof
   switch, every .proof-only section, each .proof-cta phrase, and the
   emptying-poles .formal section — and leaves a "proof coming soon" note
   where the switch was. */
(function(){
  var state = window.PUZZLE_STATE || {};
  var css = '';
  var m = location.pathname.match(/puzzles\/([^/]+)\//);
  if (m) {
    var st = state[m[1]];
    if (st && !st.proof) {
      css = '.modeswitch,.dd-modeswitch,.dd-divider,.proof-only,.proof-cta,.formal{display:none!important}' +
            '.veil-note{text-align:center;font-style:italic;font-family:"Newsreader",Georgia,serif;' +
            'font-size:15px;color:#6c655a;margin:30px 0 6px}';
      document.addEventListener('DOMContentLoaded', function(){
        var ms = document.querySelector('.modeswitch');
        if (!ms) return;
        var note = document.createElement('p');
        note.className = 'veil-note';
        note.textContent = 'proof coming soon';
        ms.replaceWith(note);
      });
    }
  } else {
    for (var slug in state) {
      if (!state[slug].published) css += 'li[data-puzzle="' + slug + '"]{display:none}';
    }
  }
  if (css) {
    var style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }
})();
