// SYNTAX TEST "source.gsx" "element/component literals as values in Go code"
package views

var icon = <Icon/>
//         ^ punctuation.definition.tag.gsx
//          ^ entity.name.type.component.gsx

var box = <div class="ok"/>
//        ^ punctuation.definition.tag.gsx
//         ^ entity.name.tag.gsx
//             ^ entity.other.attribute-name.gsx

func make() gsx.Node { return <ui.Card/> }
//                            ^ punctuation.definition.tag.gsx
//                             ^ entity.name.type.component.gsx

func nested(cond bool) gsx.Node {
  if cond { return <span/> }
//                 ^ punctuation.definition.tag.gsx
//                  ^ entity.name.tag.gsx
  return <>x</>
//       ^ punctuation.definition.tag.gsx
}

// Regression: gofmt-spaced comparison is NOT markup.
func cmp(a int, b int) bool { return a < b }
//                                     ^ keyword.operator.comparison.go

// Regression: a '<' inside a string is not a tag.
var note = "text <notag> here"
//               ^ string.quoted.double.go
//                ^ string.quoted.double.go
