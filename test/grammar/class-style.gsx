// SYNTAX TEST "source.gsx" "class/style attribute value embedding"
package views

component Card(x string) {
  <div class={"primary"}>
//     ^ entity.other.attribute-name.class.gsx
//           ^ punctuation.section.embedded.begin.gsx
//            ^ meta.embedded.block.go.gsx
//                     ^ punctuation.section.embedded.end.gsx
    <span style={"color:red"}>
//        ^ entity.other.attribute-name.gsx
//              ^ punctuation.section.embedded.begin.gsx
//               ^ meta.embedded.block.go.gsx
//                          ^ punctuation.section.embedded.end.gsx
    </span>
    <span class={switch variant { case 1: "green" default: "gray" }}>
//        ^ entity.other.attribute-name.class.gsx
//               ^ meta.embedded.block.go.gsx
//                                         ^ meta.embedded.block.go.gsx
    </span>
  </div>
}
