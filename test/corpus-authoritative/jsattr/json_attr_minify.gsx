package views

component C(selfID string) {
	<div hx-vals=js`{ "exclude": "SELF-1" }`></div>
	<div hx-vals=js`{ "exclude": @{selfID} }`></div>
	<div x-data=js`{ open: false }`></div>
}
