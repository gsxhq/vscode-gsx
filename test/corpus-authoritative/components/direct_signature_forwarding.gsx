package views

import "github.com/gsxhq/gsx"

component Generic[T string | int](value T) { <span>{ value }</span> }
component Grouped[T, U string | int](first T, second U) { <b>{ first }:{ second }</b> }
component ConstraintOnly[T interface{ ~string }]() { <i>constraint</i> }
component Variadic(prefix string, values ...int) { <u>{ prefix }:{ len(values) }</u> }
component AttrVariadic(attrs ...gsx.Attr) { <mark { gsx.Attrs(attrs)... }>attrs</mark> }

component Page() {
	<Generic[string] value="generic"/>
	<Grouped[string, int] first="grouped" second={ 2 }/>
	<ConstraintOnly[string]/>
	<Variadic prefix="variadic"/>
	<AttrVariadic data-kind="attrs"/>
}
