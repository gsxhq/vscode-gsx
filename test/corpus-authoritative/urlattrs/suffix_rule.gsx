package views

import "github.com/gsxhq/gsx"

component Direct(u string) {
	<a data-cancel-url={u} data-urlish={u}>x</a>
}

component Bagged(attrs gsx.Attrs) {
	<a { attrs... }>y</a>
}

component Page() {
	<Direct u={"javascript:alert(1)"}/>
	<Direct u={"/safe"}/>
	<Bagged attrs={gsx.Attrs{
		{Key: "data-submit-url", Value: "javascript:alert(2)"},
		{Key: "data-urlish", Value: "javascript:alert(3)"},
	}}/>
}
