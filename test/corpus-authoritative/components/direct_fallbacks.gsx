package views

import (
	"github.com/gsxhq/gsx"
	"corpustest/cases/components_direct_fallbacks/dep"
)

component (cards Cards) Method(value string) { <mark>{ value }</mark> }

component Fallbacks(cards Cards, render func(string) gsx.Node) {
	<dep.Imported value="imported"/>
	<cards.Method value="method"/>
	<Variable value="variable"/>
	<Plain value="plain"/>
	{ render("dynamic") }
}

component Page() { <Fallbacks cards={ Cards{} } render={ Dynamic }/> }
