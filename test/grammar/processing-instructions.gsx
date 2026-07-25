// SYNTAX TEST "source.gsx" "processing instructions: marker and region"
package views

component Page(id string) {
  <li>
    text
  </li>
  <?marker name="results">
//^ punctuation.definition.tag.gsx
//   ^ entity.name.tag.processing-instruction.gsx
//          ^ entity.other.attribute-name.gsx
//                ^ string.quoted.double.gsx
  <?marker name={id}>
//^ punctuation.definition.tag.gsx
//   ^ entity.name.tag.processing-instruction.gsx
//          ^ entity.other.attribute-name.gsx
//              ^ punctuation.section.embedded.begin.gsx
//               ^ source.go
  <?start name="feed">
//^ punctuation.definition.tag.gsx
//   ^ entity.name.tag.processing-instruction.gsx
//         ^ entity.other.attribute-name.gsx
    <span>loading</span>
  <?end>
//^ punctuation.definition.tag.gsx
//   ^ entity.name.tag.processing-instruction.gsx
//     ^ punctuation.definition.tag.gsx
  <?markerx name="a">
//   ^ - entity.name.tag.processing-instruction.gsx
//   ^ - entity.name.tag.gsx
  <?foo name="a">
//   ^ - entity.name.tag.processing-instruction.gsx
}
