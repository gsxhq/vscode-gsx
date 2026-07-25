package views

component Page(show bool, ids []string) {
	{ if show {
		<?marker name="banner">
	} }
	{ for _, id := range ids {
		<?marker name={id}>
	} }
}
