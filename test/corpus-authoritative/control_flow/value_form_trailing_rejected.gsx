package views

component C(x int) {
	<span class={ "base", switch x { case 1: "a" default: "b" } |> upper }>y</span>
}
