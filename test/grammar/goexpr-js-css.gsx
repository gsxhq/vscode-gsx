// SYNTAX TEST "source.gsx" "js/css literals as Go-expression values + spaced braced attr form"
package views

var snippet = js`emit(@{id})`
//            ^ support.type.embedded-language.gsx
//              ^ punctuation.definition.string.begin.gsx
//               ^ meta.embedded.block.js.gsx
//                    ^ punctuation.section.embedded.begin.gsx

var theme = css`--n:@{count}`
//          ^ support.type.embedded-language.gsx
//             ^ punctuation.definition.string.begin.gsx
//              ^ meta.embedded.block.css.gsx
//                  ^ punctuation.section.embedded.begin.gsx

var boxed = wrap(js"pulse(@{n})")
//               ^ support.type.embedded-language.gsx
//                 ^ punctuation.definition.string.begin.gsx
//                        ^ punctuation.section.embedded.begin.gsx

component Page(id string, count int) {
  {{ x := js`emit(@{id})` }}
//^ punctuation.section.embedded.begin.gsx
//        ^ support.type.embedded-language.gsx
//                ^ punctuation.section.embedded.begin.gsx
  <div data-x={ css`--n:@{count}` }>ok</div>
//     ^ entity.other.attribute-name.gsx
//            ^ punctuation.section.embedded.begin.gsx
//              ^ support.type.embedded-language.gsx
//                 ^ punctuation.definition.string.begin.gsx
//                    ^ meta.embedded.block.css.gsx
//                      ^ punctuation.section.embedded.begin.gsx
//                                ^ punctuation.section.embedded.end.gsx
  <button @click={ js`track(@{count})` }>go</button>
//        ^ entity.other.attribute-name.gsx
//               ^ punctuation.section.embedded.begin.gsx
//                 ^ support.type.embedded-language.gsx
//                   ^ punctuation.definition.string.begin.gsx
//                    ^ meta.embedded.block.js.gsx
//                          ^ punctuation.section.embedded.begin.gsx
//                                     ^ punctuation.section.embedded.end.gsx
}
