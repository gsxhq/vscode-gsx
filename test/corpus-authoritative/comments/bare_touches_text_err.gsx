package views

import "github.com/gsxhq/gsx"

component BothSides() {
	<p>
		before
		// note
		after
	</p>
}

component TextBeforeOnly() {
	<p>
		before
		// note
	</p>
}

component TextAfterOnly() {
	<p>
		// note
		after
	</p>
}

component EmptyNextToText() {
	<p>
		before
		//
	</p>
}

component Slot(header gsx.Node) {
	<div>{header}</div>
}

component TouchesTextInSlotInsidePre() {
	<pre><Slot header={
		<span>a</span>
		// note
		after
	}/></pre>
}
