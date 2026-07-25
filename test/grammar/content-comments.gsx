// SYNTAX TEST "source.gsx" "bare // line comments in child content"
package views

component C() {
  <div>
    <span>a</span>
    // between tags, own line
//  ^ comment.line.double-slash.gsx
    <span>b</span>
    text // mid-line stays literal text
//       ^ - comment.line.double-slash.gsx
    <p>// glued right after a tag is still mid-line</p>
//     ^ - comment.line.double-slash.gsx
    <p>a /* not a comment in child content */ b</p>
//       ^ - comment
  </div>
}

component Bodies(n int, kind string) {
  <p>{ if n > 0 {
    <b>x</b>
    // own line inside an if body
//  ^ comment.line.double-slash.gsx
  } }</p>
  <span>{ switch kind {
  case "a":
    <b>y</b>
    // own line inside a case body
//  ^ comment.line.double-slash.gsx
  default:
    <b>z</b>
  } }</span>
}
