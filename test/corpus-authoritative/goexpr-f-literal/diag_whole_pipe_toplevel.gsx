package demo

func mk() string { return f`hi` |> upper }

component Page() {
	<div>{ mk() }</div>
}
