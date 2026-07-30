package views

import "github.com/gsxhq/gsx"

component Mixed[T string | int](v T) {
	<meta http-equiv="refresh" content={v}/>
}

component Bag(attrs gsx.Attrs) {
	<meta http-equiv="refresh" { attrs... }/>
}

component Hole(u string) {
	<meta http-equiv="refresh" content=f"0;url=@{u}"/>
}

component Page() {
	<Mixed[string] v={"0;url=javascript:alert(1)"}/>
	<Mixed[string] v={"3;url=/safe"}/>
	<Mixed[int] v={5}/>
	<Bag attrs={gsx.Attrs{{Key: "content", Value: "0;url=javascript:alert(2)"}}}/>
	<Bag attrs={gsx.Attrs{{Key: "content", Value: "3;url=/safe"}}}/>
	<Hole u={"javascript:alert(3)"}/>
	<Hole u={"/safe"}/>
}
