package views

import "github.com/gsxhq/gsx"

component StaticEquiv(to string) {
	<meta http-equiv="refresh" content={"0;url=" + to}/>
}

component ExprEquiv(to string) {
	<meta http-equiv={"refresh"} content={"0;url=" + to}/>
}

component CondEquiv(legacy bool, to string) {
	<meta { if legacy { http-equiv="refresh" } } content={"0;url=" + to}/>
}

component DynamicEquiv(kind string, to string) {
	<meta http-equiv={kind} content={"0;url=" + to}/>
}

component EquivInBag(attrs gsx.Attrs, to string) {
	<meta content={"0;url=" + to} { attrs... }/>
}

component NoEquivAtAll(to string) {
	<meta content={"0;url=" + to}/>
}

component NotARefresh(v string) {
	<meta name="description" content={v}/>
}

component Page() {
	<StaticEquiv to={"javascript:alert(1)"}/>
	<ExprEquiv to={"javascript:alert(2)"}/>
	<CondEquiv legacy={true} to={"javascript:alert(3)"}/>
	<DynamicEquiv kind={"refresh"} to={"javascript:alert(4)"}/>
	<EquivInBag attrs={gsx.Attrs{{Key: "http-equiv", Value: "refresh"}}} to={"javascript:alert(5)"}/>
	<NoEquivAtAll to={"javascript:alert(6)"}/>
	<NotARefresh v={"A perfectly ordinary description."}/>
	<NotARefresh v={"5;url=/relative-is-allowed"}/>
}
