/* The spoiler curtain. On the reader's first flip to Proof, the proof
   sections appear blurred behind a small panel: a teaser line, a lift
   button, and a way back to the board. Lifting the curtain is remembered
   per puzzle (localStorage "curtain:<slug>") — it is never shown again.

   Self-contained: wraps the page's global setMode() after DOM load.
   Pages without a mode switch (or whose proof is unpublished per
   PUZZLE_STATE) are untouched. New puzzles need only this script tag. */
(function(){
  var m = location.pathname.match(/puzzles\/([^/]+)\//);
  if (!m) return;
  var slug = m[1], key = 'curtain:' + slug;

  var lifted = false;
  try { lifted = !!localStorage.getItem(key); } catch (e) { lifted = true; }
  if (lifted) return;

  var css =
    'section.proof-only{transition:filter 1.1s ease}' +
    'body.curtained section.proof-only{filter:blur(6px);pointer-events:none;user-select:none}' +
    '.curtain-panel{text-align:center;max-width:440px;margin:26px auto 10px;padding:26px 28px;' +
      'border:1px dashed var(--line,#ddd2b8);border-radius:14px;background:rgba(255,253,246,.92)}' +
    '.curtain-tease{font-family:"Newsreader",Georgia,serif;font-style:italic;font-size:16.5px;' +
      'line-height:1.6;color:#4a4438;margin:0 0 18px}' +
    '.curtain-lift{font-family:"JetBrains Mono",monospace;font-size:12px;letter-spacing:.12em;' +
      'text-transform:uppercase;background:var(--ink,#1E1B16);color:var(--paper,#FBF7EC);' +
      'border:1px solid var(--ink,#1E1B16);border-radius:22px;padding:10px 22px;cursor:pointer;transition:.18s}' +
    '.curtain-lift:hover{background:var(--paper,#FBF7EC);color:var(--ink,#1E1B16)}' +
    '.curtain-back{display:block;margin-top:14px;font-family:"JetBrains Mono",monospace;' +
      'font-size:11px;letter-spacing:.08em;color:#6c655a}' +
    '.curtain-panel.lifted{opacity:0;pointer-events:none;transition:opacity .9s ease}';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  document.addEventListener('DOMContentLoaded', function(){
    var orig = window.setMode;
    var ms = document.querySelector('.modeswitch');
    if (typeof orig !== 'function' || !ms) return;
    var st = (window.PUZZLE_STATE || {})[slug];
    if (st && !st.proof) return;   /* proof unpublished — veil.js owns this page */

    var panel = null;

    function lift(){
      try { localStorage.setItem(key, '1'); } catch (e) {}
      lifted = true;
      document.body.classList.remove('curtained');
      panel.classList.add('lifted');
      setTimeout(function(){ panel.remove(); panel = null; }, 1000);
    }

    function show(){
      document.body.classList.add('curtained');
      if (panel) return;
      panel = document.createElement('div');
      panel.className = 'proof-only curtain-panel';
      panel.innerHTML =
        '<p class="curtain-tease">The proof is right here. Don&rsquo;t look before you&rsquo;ve tried the puzzle yourself.</p>' +
        '<button class="curtain-lift">I&rsquo;ve tried &mdash; lift the curtain</button>' +
        '<a class="curtain-back" href="#">one more round first</a>';
      panel.querySelector('.curtain-lift').addEventListener('click', lift);
      panel.querySelector('.curtain-back').addEventListener('click', function(e){
        e.preventDefault();
        window.setMode('play');
      });
      ms.after(panel);
    }

    window.setMode = function(mode){
      orig(mode);
      if (mode === 'proof' && !lifted) show();
      else if (mode !== 'proof') document.body.classList.remove('curtained');
    };
  });
})();
