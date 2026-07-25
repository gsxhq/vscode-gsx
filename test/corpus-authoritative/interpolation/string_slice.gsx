package views

type Tags []string

component Page(tags []string, named Tags) {
	<div>{tags}</div>
	<div data-tags={tags}>x</div>
	<div>{named}</div>
}
