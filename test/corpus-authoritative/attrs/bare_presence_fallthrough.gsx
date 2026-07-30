package views

import "github.com/gsxhq/gsx"

component Leaf(attrs gsx.Attrs) {
	<div { attrs... }/>
}

component Wrapper(attrs gsx.Attrs) {
	<Leaf { attrs... }/>
}

component Page(show bool, before gsx.Attrs, after gsx.Attrs) {
	<Leaf data-leaf-marker/>
	<Wrapper data-nested-marker/>
	<Leaf data-valued={true}/>
	<Leaf aria-expanded={false}/>
	<Leaf href={true}/>
	<Leaf focusable={false}/>
	<Leaf data-toggle={gsx.Toggle(true)}/>
	<Leaf { if show { data-conditional-marker } }/>
	<div { before... } data-folded-marker { after... }/>
}
