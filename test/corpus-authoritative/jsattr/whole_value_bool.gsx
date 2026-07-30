package views

import "strconv"

component Page(open bool) {
	<div x-show={ open }>x</div>
	<div x-show="true">s</div>
	<div x-show={ strconv.FormatBool(open) }>f</div>
	<div x-show=js`open`>j</div>
}
