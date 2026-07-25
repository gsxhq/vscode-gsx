package views

import "github.com/gsxhq/gsx"

component Panel(attrs gsx.Attrs) {
	{{ attrs := "hi" }}
	<div>{attrs}</div>
}
