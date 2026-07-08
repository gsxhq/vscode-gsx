// SYNTAX TEST "source.gsx" "double-quote embedded literals + tags/fragments as values in braces"
package views

var greeting = f`hi @{name}`
//             ^ support.type.embedded-language.gsx
//              ^ punctuation.definition.string.begin.gsx
//                  ^ punctuation.section.embedded.begin.gsx

component Page(name string) {
  <button @click=js"toggle(@{id})"/>
//               ^ support.type.embedded-language.gsx
//                 ^ punctuation.definition.string.begin.gsx
//                         ^ punctuation.section.embedded.begin.gsx
  <div>{ wrap(<span/>) }</div>
//            ^ punctuation.definition.tag.gsx
//             ^ entity.name.tag.gsx
  <div>{ items(<>x</>) }</div>
//             ^ punctuation.definition.tag.gsx
}
