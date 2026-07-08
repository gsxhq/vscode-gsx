// SYNTAX TEST "source.gsx" "interpolating literals: f prefix opt-in, bare = plain string"
package views

component Badge(variant string, n int) {
  <span class=f`badge badge-@{variant} n-@{n}`>Hi</span>
//      ^ entity.other.attribute-name.gsx
//            ^ support.type.embedded-language.gsx
//             ^ punctuation.definition.string.begin.gsx
//              ^ string.interpolated.gsx
//                          ^ punctuation.section.embedded.begin.gsx
//                            ^ source.go
  <span class=f"badge-@{variant}">Hi</span>
//            ^ support.type.embedded-language.gsx
//             ^ punctuation.definition.string.begin.gsx
//              ^ string.interpolated.gsx
//                    ^ punctuation.section.embedded.begin.gsx
//                      ^ source.go
  <span class=`plain @{not-a-hole}`>Hi</span>
//            ^ string.quoted.other.backtick.gsx
//                   ^ string.quoted.other.backtick.gsx
  <a :class=f`@{gsx.RawJS("hi")}`>x</a>
//   ^ entity.other.attribute-name.gsx
//          ^ support.type.embedded-language.gsx
//           ^ punctuation.definition.string.begin.gsx
//            ^ punctuation.section.embedded.begin.gsx
//              ^ source.go
  <p>{ f`hi @{name}` }</p>
//     ^ support.type.embedded-language.gsx
//      ^ punctuation.definition.string.begin.gsx
//          ^ punctuation.section.embedded.begin.gsx
}
