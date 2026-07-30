package views

import "github.com/gsxhq/gsx"

component C(n int, extra gsx.Attrs) { <div { switch n { case 1: data-one="y" default: data-other="y" } } { extra... }>x</div> }
