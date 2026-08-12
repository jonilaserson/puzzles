/* Math typesetting for the whole site: KaTeX, loaded from a CDN like the fonts.
   Include once per page:  <script src="../../assets/math.js"></script>
   Write inline math as \( ... \) and display math as \[ ... \].
   Display math is centered; long rows scroll sideways instead of overflowing.
   Content injected after page load (widgets, React) is NOT auto-rendered —
   call window.renderMath(element) on it if it contains math. */
(function(){
  var V = 'https://cdn.jsdelivr.net/npm/katex@0.16.21/dist/';

  var css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = V + 'katex.min.css';
  document.head.appendChild(css);

  var style = document.createElement('style');
  style.textContent =
    '.katex{font-size:1.06em}' +
    '.katex-display{margin:12px 0;overflow-x:auto;overflow-y:hidden;padding:2px 0}';
  document.head.appendChild(style);

  function load(src, cb){
    var s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    document.head.appendChild(s);
  }

  load(V + 'katex.min.js', function(){
    load(V + 'contrib/auto-render.min.js', function(){
      window.renderMath = function(el){
        renderMathInElement(el || document.body, {
          delimiters: [
            {left: '\\(', right: '\\)', display: false},
            {left: '\\[', right: '\\]', display: true}
          ],
          throwOnError: false
        });
      };
      if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', function(){ window.renderMath(); });
      else
        window.renderMath();
    });
  });
})();
