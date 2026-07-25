package p

component Icon(color string) {
	<img src=f`data:image/svg+xml,%3Csvg fill='@{color}'%3E%3C/svg%3E` alt="i"/>
}
