package views

import "github.com/gsxhq/gsx"

type cardData struct {
	Title string
}

component Card(d cardData, children gsx.Node, attrs gsx.Attrs) {
	<div {attrs...}>{ d.Title }{children}</div>
}

component Page() {
	data := cardData{Title: "Hello"}
	<Card { data... }>child</Card>
}
