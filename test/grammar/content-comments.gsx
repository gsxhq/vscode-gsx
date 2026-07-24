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
  </div>
}
