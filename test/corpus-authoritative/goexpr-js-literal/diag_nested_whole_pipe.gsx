package demo

component Page() {
	<div>{ wrap(js`f(@{x})` |> upper) }</div>
}
