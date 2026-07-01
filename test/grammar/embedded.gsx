// SYNTAX TEST "source.gsx" "embedded js/css"
package views

component Page() {
  <button @click=js`save(@{id})` style=css`width:@{pct}%`/>
//        ^ entity.other.attribute-name.gsx
//               ^ meta.embedded.block.js.gsx
//                       ^ punctuation.section.embedded.begin.gsx
//                                     ^ meta.embedded.block.css.gsx
//                                               ^ punctuation.section.embedded.begin.gsx
  <button @click={js`save(@{id})`} style={css`width:@{pct}%`}/>
//               ^ punctuation.section.embedded.begin.gsx
//                ^ meta.embedded.block.js.gsx
//                        ^ punctuation.section.embedded.begin.gsx
//                                       ^ punctuation.section.embedded.begin.gsx
//                                        ^ meta.embedded.block.css.gsx
//                                                  ^ punctuation.section.embedded.begin.gsx
  <button @click=js`save(\`hi @{id}\`)`/>
//                         ^ meta.embedded.block.js.gsx
//                            ^ punctuation.section.embedded.begin.gsx
//                                    ^ punctuation.definition.string.end.gsx
  <style>
//   ^ entity.name.tag.gsx
  .a { color: red }
  </style>
  <script>
//   ^ entity.name.tag.gsx
  const x = 1
  </script>
}
