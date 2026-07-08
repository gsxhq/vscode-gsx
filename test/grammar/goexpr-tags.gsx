// SYNTAX TEST "source.gsx" "element/component literals as values in top-level Go"
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
