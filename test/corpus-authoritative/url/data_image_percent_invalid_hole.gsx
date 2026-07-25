package p

component Icon(pct string) {
	<img src=f`data:image/svg+xml,@{pct}` alt="i"/>
}
