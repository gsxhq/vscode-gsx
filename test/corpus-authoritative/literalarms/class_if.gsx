package views

component C(c bool, v string) { <div class={ "base", if c { f`btn-@{v}` } else { "off" } }>x</div> }
