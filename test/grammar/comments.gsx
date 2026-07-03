// SYNTAX TEST "source.gsx" "gsx source comments"
package views

component C(name string) {
  <input
    type="checkbox"
    // own-line note
//  ^ comment.line.double-slash.gsx
    id={name} // trailing note
//            ^ comment.line.double-slash.gsx
    /* block note */
//  ^ comment.block.gsx
  />
}
