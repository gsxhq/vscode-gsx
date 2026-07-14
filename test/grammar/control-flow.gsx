// SYNTAX TEST "source.gsx" "control-flow bodies are child content"
package views

component Demo(n int, kind string) {
  <p>{ if n > 0 { Don't panic } else { fine } }</p>
//     ^ keyword.control.go
//                ^ meta.component.gsx -meta.embedded.block.go.gsx
//                   ^ -string.quoted.single.go
//                              ^ keyword.control.go
  <span>{ switch kind {
//        ^ keyword.control.go
  case "warn":
//^ keyword.control.go
//     ^ string.quoted.double.go
    <b>can't warn</b>
//     ^ meta.component.gsx -meta.embedded.block.go.gsx
//        ^ -string.quoted.single.go
  default:
//^ keyword.control.go
    <b>it's ok</b>
//       ^ -string.quoted.single.go
  } }</span>
}
