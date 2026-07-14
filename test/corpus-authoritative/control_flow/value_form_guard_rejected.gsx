package views

component C(v int) {
	<span class={ if v > 0 { "a" } else { "b" }: v > 0 }>x</span>
}
