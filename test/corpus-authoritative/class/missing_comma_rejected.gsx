package views

component Meter(value int, color string) {
	<div
		class={ "meter", "meter-full": value >= 100 }
		style={ value |> printf("width: %d%%") "color: " + color }
	/>
}
