package views

component Sep(a, b string) {
	<div id="if">{ if true { {a} - {b} } }</div>
	<div id="multi">{ if true { {a}   -   {b} } }</div>
	<div id="else">{ if false { <span/> } else { {a} - {b} } }</div>
	<div id="nl">{ if true {
		{a}
		- {b}
	} }</div>
	<div id="nest">{ if true { A - { if true { B } } } }</div>
}
