package views

import "github.com/gsxhq/gsx"

component Leaf(attrs gsx.Attrs) { <span { attrs... }>leaf</span> }

component C(n int) { <Leaf { switch n { case 1: data-one="y" default: data-other="y" } }/> }
