package demo

component Page() {
	{{ h := js"f()" |> minify }}
	<p>done</p>
}
