package views

import "github.com/gsxhq/gsx"

type cardData struct {
	Title string
}

component Card(d cardData, attrs gsx.Attrs) {
	<div>{ d.Title }</div>
}

component Page() {
	<Card {...}/>
}
