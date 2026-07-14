package views

type cardData struct {
	Title string
}

component Card(d cardData) {
	<div>{ d.Title }</div>
}

component Page() {
	<Card {...}/>
}
