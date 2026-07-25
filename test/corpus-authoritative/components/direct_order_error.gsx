package views

component Ordered(first, second, last string) {
	<p>{ first }/{ second }/{ last }</p>
}

component OrderPage(fail bool) {
	<Ordered
		first={ directMark("first") }
		second={ directPair("pair", fail) }
		last={ directMark("last") }
	/>
}
