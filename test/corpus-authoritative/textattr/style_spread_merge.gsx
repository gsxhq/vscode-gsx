package views


import "github.com/gsxhq/gsx"
component Box(w int, attrs gsx.Attrs) {
	<div style=css`width:@{w}px` { attrs... }>x</div>
}
