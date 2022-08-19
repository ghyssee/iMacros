/** MyDocumentUtils
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */

function querySelectorContainsText(selector, text) {
  var elements = window.content.document.querySelectorAll(selector);
  for (var i=0; i < elements.length; i++){
	  var el = elements[i];
	  if (el.innerText.indexOf(text) !== -1) {
		  return el;
	  }		
  }
  return null;
}