// SYNTAX TEST "source.gsx" "go holes nested inside embedded js braces"
package views

component H(entityType, opportunityType string) {
  <input hx-vals=js`{"entity_type": @{entityType}, "opportunity_type": @{opportunityType}}`/>
//                                  ^ punctuation.section.embedded.begin.gsx
//                                    ^ source.go
//                                                                     ^ punctuation.section.embedded.begin.gsx
//                                                                                        ^ punctuation.definition.string.end.gsx
  <div>after</div>
//^ punctuation.definition.tag.gsx
// ^ entity.name.tag.gsx
}
