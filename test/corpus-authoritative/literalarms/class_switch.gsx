package views

component C(n int, v string) { <div class={ switch n { case 1: f`btn-@{v}` default: "plain" } }>x</div> }
