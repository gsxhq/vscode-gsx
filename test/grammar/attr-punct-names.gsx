// SYNTAX TEST "source.gsx" "attribute names under the HTML authoring rule (punctuation-led names)"
package views

component Demo(on bool, v string) {
  <input .prop="x" ?disabled={on} #ref [a]={v} (b)="c"/>
//       ^^^^^ entity.other.attribute-name.gsx
//            ^ keyword.operator.assignment.gsx
//             ^^^ string.quoted.double.gsx
//                 ^^^^^^^^^ entity.other.attribute-name.gsx
//                          ^ keyword.operator.assignment.gsx
//                           ^ punctuation.section.embedded.begin.gsx
//                            ^^ meta.embedded.block.go.gsx source.go
//                              ^ punctuation.section.embedded.end.gsx
//                                ^^^^ entity.other.attribute-name.gsx
//                                     ^^^ entity.other.attribute-name.gsx
//                                        ^ keyword.operator.assignment.gsx
//                                         ^ punctuation.section.embedded.begin.gsx
//                                             ^^^ entity.other.attribute-name.gsx
//                                                ^ keyword.operator.assignment.gsx
//                                                 ^^^ string.quoted.double.gsx
//                                                    ^^ punctuation.definition.tag.gsx
  <input on:click|preventDefault={v} *ngIf="cond" a&b $x !y x-on:keyup.enter.prevent/>
//       ^^^^^^^^^^^^^^^^^^^^^^^ entity.other.attribute-name.gsx
//                              ^ keyword.operator.assignment.gsx
//                               ^ punctuation.section.embedded.begin.gsx
//                                   ^^^^^ entity.other.attribute-name.gsx
//                                        ^ keyword.operator.assignment.gsx
//                                         ^^^^^^ string.quoted.double.gsx
//                                                ^^^ entity.other.attribute-name.gsx
//                                                    ^^ entity.other.attribute-name.gsx
//                                                       ^^ entity.other.attribute-name.gsx
//                                                          ^^^^^^^^^^^^^^^^^^^^^^^^ entity.other.attribute-name.gsx
//                                                                                  ^^ punctuation.definition.tag.gsx
  <Leaf .prop="x" ?disabled/>
// ^^^^ entity.name.type.component.gsx
//      ^^^^^ entity.other.attribute-name.gsx
//           ^ keyword.operator.assignment.gsx
//            ^^^ string.quoted.double.gsx
//                ^^^^^^^^^ entity.other.attribute-name.gsx
//                         ^^ punctuation.definition.tag.gsx
  <button .label=f`hi @{v}` [style]=css`color:@{v}` ?on=js"go(@{v})"/>
//        ^^^^^^ entity.other.attribute-name.gsx
//              ^ keyword.operator.assignment.gsx
//               ^ support.type.embedded-language.gsx
//                ^ punctuation.definition.string.begin.gsx
//                    ^^ punctuation.section.embedded.begin.gsx
//                          ^^^^^^^ entity.other.attribute-name.gsx
//                                 ^ keyword.operator.assignment.gsx
//                                  ^^^ support.type.embedded-language.gsx
//                                                  ^^^ entity.other.attribute-name.gsx
//                                                     ^ keyword.operator.assignment.gsx
//                                                      ^^ support.type.embedded-language.gsx
  <input { if on { ?disabled .prop="x" } } id="b"/>
//       ^ punctuation.section.embedded.begin.gsx
//         ^^ keyword.control.go
//                ^^^^^^^^^^^^^^^^^ meta.embedded.block.go.gsx source.go
//                                       ^ punctuation.section.embedded.end.gsx
//                                         ^^ entity.other.attribute-name.gsx
//                                           ^ keyword.operator.assignment.gsx
}
