package views

component C(n int) {
	<div
		{ switch n {
		case 1:
			data-one="y"
		case 2, 3:
			data-two="y" data-three="y"
		default:
			data-other="y"
		} }
		id="b"
	>x</div>
}
