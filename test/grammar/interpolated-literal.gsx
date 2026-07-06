// SYNTAX TEST "source.gsx" "interpolating attribute literals"
package views

component Badge(variant string, n int) {
  <span class=`badge badge-@{variant} n-@{n}`>Hi</span>
//      ^ entity.other.attribute-name.gsx
//            ^ punctuation.definition.string.begin.gsx
//             ^ string.interpolated.gsx
//                         ^ punctuation.section.embedded.begin.gsx
//                           ^ meta.embedded.block.go.gsx
//                                  ^ punctuation.section.embedded.end.gsx
  <a :class=`@{gsx.RawJS("hello")}`>x</a>
//   ^ entity.other.attribute-name.gsx
//          ^ punctuation.definition.string.begin.gsx
//           ^ punctuation.section.embedded.begin.gsx
//             ^ meta.embedded.block.go.gsx
}
