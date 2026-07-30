package views

import "github.com/gsxhq/gsx"

component Img(u string) {
	<img data-src={u}/>
}

component Div(u string) {
	<div data-src={u}></div>
}

component BaggedImg(attrs gsx.Attrs) {
	<img { attrs... }/>
}

component BaggedDiv(attrs gsx.Attrs) {
	<div { attrs... }></div>
}

component Page() {
	<Img u={"javascript:alert(1)"}/>
	<Div u={"javascript:alert(2)"}/>
	<BaggedImg attrs={gsx.Attrs{{Key: "data-src", Value: "javascript:alert(3)"}}}/>
	<BaggedDiv attrs={gsx.Attrs{{Key: "data-src", Value: "javascript:alert(4)"}}}/>
}
