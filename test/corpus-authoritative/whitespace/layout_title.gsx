package views

component Title(env, page string, isProd bool) {
	<title>{ if !isProd { {env} - } } {page} - One Learning</title>
}
