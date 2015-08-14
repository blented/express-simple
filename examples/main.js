document.addEventListener('DOMContentLoaded', function()
{
	document.getElementById('connect-button').addEventListener('click', connect)
})

function connect(){
	chrome.runtime.sendMessage('jmgiehhajkmpinbicmejgjifeohineog', document.getElementById('input-text').value)
}