package views

import "github.com/gsxhq/gsx"

component RootBody() {
	<span>a</span>
	// component body root note
	<span>b</span>
}

component FragChildren() {
	<>
		<span>a</span>
		// fragment children note
		<span>b</span>
	</>
}

component IfBody(n int) {
	<p>{ if n > 0 {
		<span>a</span>
		// if body note
		<span>b</span>
	} }</p>
}

component ForBody(items []string) {
	<ul>{ for _, it := range items {
		<li>{it}</li>
		// for body note
	} }</ul>
}

component CaseBody(kind string) {
	<span>{ switch kind {
	case "a":
		<b>x</b>
		// switch case body note
		<b>y</b>
	default:
		<b>z</b>
	} }</span>
}

component Slot(header gsx.Node) {
	<div>{header}</div>
}

// ChildProp: the comment is a direct MarkupAttr-value sibling between two
// <span> children of `header={ ... }`, pinning checkBareComments'
// `case *gsxast.MarkupAttr: check(v.Value)` walk.
component ChildProp() {
	<Slot header={
		<span>a</span>
		// child-prop note
		<span>b</span>
	}/>
}

var elementLit = (
	<div>
		<span>a</span>
		// element-literal note
		<span>b</span>
	</div>
)

component ElementLitUser() {
	<p>{ elementLit }</p>
}

component HoleNeighbor(name string) {
	<p>
		{name}
		// hole-neighbor note
	</p>
}

component HTMLCommentNeighbor() {
	<p>
		<!-- kept -->
		// html-comment-neighbor note
		<!-- kept2 -->
	</p>
}

component BracedCommentNeighbor() {
	<p>
		{/* block */}
		// braced-comment-neighbor note
	</p>
}
