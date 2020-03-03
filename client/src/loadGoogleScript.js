/*
 * Ensures the Google package script is preloaded before the React files are run to ensure
 * the google.maps package is available to React
 */

export default function loadJS(src) {
  var ref = window.document.getElementsByTagName('script')[0];
  var script = window.document.createElement('script');
  script.src = src;
  script.async = true;
  ref.parentNode.insertBefore(script, ref);
}
