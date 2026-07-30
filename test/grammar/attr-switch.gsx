// SYNTAX TEST "source.gsx" "in-tag switch attribute and literal value-form arms"
package views

component Demo(n int, w string, v string) {
  <div { switch n { case 1: data-one="y" default: data-other="y" } } id="b">x</div>
//       ^^^^^^ keyword.control.go
//                  ^^^^ keyword.control.go
//                                       ^^^^^^^ keyword.control.go
//                                                                   ^^ entity.other.attribute-name.gsx
  <span style={ switch n { case 1: css`a: @{w}` default: css`b: @{w}` } }>y</span>
//              ^^^^^^ keyword.control.go
//                                 ^^^^ meta.embedded.block.css.gsx
//                                              ^^^^^^^ keyword.control.go
  <b class={ "base", if n > 0 { f`btn-@{v}` } else { "off" } }>z</b>
//                   ^^ keyword.control.go
//                              ^^ meta.embedded.block.fstring.gsx
//                                            ^^^^ keyword.control.go
}
