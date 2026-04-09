/**
 * Sets window.jQuery before requiring MathQuill (which needs jQuery as a global).
 * Static `import` statements are hoisted, so we use `require()` for mathquill
 * to ensure jQuery is already set when mathquill initialises.
 */
import $ from 'jquery';
window.jQuery = $;
window.$ = $;

// require() is NOT hoisted — runs after window.jQuery is set above.
require('mathquill/build/mathquill.js');
