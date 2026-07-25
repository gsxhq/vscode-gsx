package views

import "github.com/gsxhq/gsx"

component Card(toggleAttrs gsx.Attrs) {
	<div { toggleAttrs... }></div>
}

component Page() {
	<Card toggleAttrs={{ "disabled": true, "checked": false, "data-show": true, "data-hide": false, "active": gsx.Toggle(true) }}/>
}
