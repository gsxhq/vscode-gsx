package views

import "github.com/gsxhq/gsx"

component C(n int, extra gsx.Attrs) { <div { extra... } { switch n { case 1: data-one="y" default: data-other="y" } }>x</div> }
