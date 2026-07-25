package p

component Bad() {
	<img src=f`data:application/pdf;base64,AAAA` alt="x"/>
	<a href=f`javascript:alert(1)`>x</a>
}
