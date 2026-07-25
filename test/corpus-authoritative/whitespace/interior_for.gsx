package views

component List(items []string) {
	<div>{ for i, it := range items { {i}: {it} } }</div>
}
