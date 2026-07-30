package views

import "github.com/gsxhq/gsx"

component Page(on bool) {
	<input required={on} />
	<input checked={on} />
	<div hidden={on}>h</div>
	<div aria-expanded={on}>a</div>
	<div aria-checked={on}>ac</div>
	<div contenteditable={on}>c</div>
	<div spellcheck={on}>s</div>
	<div draggable={on}>dr</div>
	<div title={on}>ti</div>
	<div data-open={on}>d</div>
	<my-toggle active={on}>t</my-toggle>
	<div x-cloak={on}>xc</div>
	<div x-show={on}>x</div>
	<div hx-boost={on}>b</div>
	<svg focusable={on}><circle r="1"/></svg>
	<math displaystyle={on}><mn>1</mn></math>
	<iframe sandbox={on}></iframe>
	<a href={on}>u</a>
	<my-toggle active={gsx.Toggle(on)}>t</my-toggle>
	<input required />
}
