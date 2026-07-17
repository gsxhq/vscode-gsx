package views

import "github.com/gsxhq/gsx"

type cardData struct {
	Title string
}

component Card(d cardData, attrs gsx.Attrs) {
	<div {attrs...}>{ d.Title }</div>
}

component Page() {
	data := cardData{Title: "Hello"}
	<Card { data... } d={cardData{Title: "x"}}/>
}
