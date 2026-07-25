package views

import "github.com/gsxhq/gsx"

component C() {
	<pre><code>
// rendered verbatim
x := 1
</code></pre>
	<textarea>
// also verbatim
</textarea>
}

component Slot(header gsx.Node) {
	<div>{header}</div>
}

component SlotInsidePre() {
	<pre><Slot header={
		<span>a</span>
		// slot-in-pre note
		<span>b</span>
	}/></pre>
}
