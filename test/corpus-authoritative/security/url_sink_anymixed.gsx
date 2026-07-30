package views

component Link[T string | int](u T) {
	<a href={u}>x</a>
}

component Img[T string | int](s T) {
	<img src={s}/>
}

component Cands[T string | int](s T) {
	<img srcset={s}/>
}

component Page() {
	<Link[string] u={"javascript:alert(1)"}/>
	<Link[string] u={"/ok"}/>
	<Link[int] u={42}/>
	<Img[string] s={"data:image/png;base64,AAAA"}/>
	<Img[string] s={"javascript:alert(1)"}/>
	<Img[int] s={7}/>
	<Cands[string] s={"a.png 1x, javascript:alert(1) 2x"}/>
}
