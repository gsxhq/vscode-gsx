package views

component Chart(labels []string, counts []int, opts map[string]string) {
	<div
		data-labels=js`@{labels}`
		data-counts=js`@{counts}`
		data-opts=js`@{opts}`
	></div>
}
