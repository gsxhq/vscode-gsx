// SYNTAX TEST "source.gsx" "embedded js/css"
package views

component Page() {
  <style>
//   ^ entity.name.tag.gsx
  .a { color: red }
  </style>
  <script>
  const x = 1
  </script>
}
