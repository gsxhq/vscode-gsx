// SYNTAX TEST "source.gsx" "gsx structure"
package views

component Card(title string) {
// <- keyword.control.component.gsx
//        ^ entity.name.function.gsx
  <div class="card">
//   ^ entity.name.tag.gsx
//       ^ entity.other.attribute-name.gsx
    <Button label="x"/>
//     ^ entity.name.type.component.gsx
    { title }
//  ^ punctuation.section.embedded.begin.gsx
  </div>
}
