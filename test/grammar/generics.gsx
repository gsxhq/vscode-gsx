// SYNTAX TEST "source.gsx" "generic components"
package views

component Field[T string | int](value T) {
// <- keyword.control.component.gsx
//        ^ entity.name.function.gsx
//             ^ meta.embedded.line.go.gsx
  <input value={value}/>
}

component Page() {
  <Field[int] value={7}/>
//   ^ entity.name.type.component.gsx
//        ^ meta.embedded.line.go.gsx
}
