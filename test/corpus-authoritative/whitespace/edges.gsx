package views

component Edges(env, title string) {
	<div id="e1">{ if true { <span>x</span> } }</div>
	<div id="e2">{ if true {    } }</div>
	<div id="e3">{ if true {
		<span>x</span>
	} }</div>
	<div id="e4">{ if true { {env} - } } {title}</div>
}
