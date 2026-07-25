package views

import "github.com/gsxhq/gsx"

component Page(on bool) {
	<input required={on} />
	<input checked={on} />
	<div hidden={on}>h</div>
	<div aria-expanded={on}>a</div>
	<div data-open={on}>d</div>
	<div contenteditable={on}>c</div>
	<my-toggle active={gsx.Toggle(on)}>t</my-toggle>
	<input required />
}
