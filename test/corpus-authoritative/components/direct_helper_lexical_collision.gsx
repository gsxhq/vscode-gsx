package views

import (
	"github.com/gsxhq/gsx"
	"corpustest/cases/components_direct_helper_lexical_collision/dep"
)

component Child() { <span>lexical</span> }
component Page[_gsxrenderChild2 any](value _gsxrenderChild.Value) { <Child/> }

func Invoke() gsx.Node { return Page[struct{}](lexicalValue()) }
