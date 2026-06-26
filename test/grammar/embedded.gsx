// SYNTAX TEST "source.gsx" "embedded js/css"
package views

component Page() {
  <style>
//   ^ entity.name.tag.gsx
  .a { color: red }
  </style>
  <script>
//   ^ entity.name.tag.gsx
  const x = 1
  </script>
}
