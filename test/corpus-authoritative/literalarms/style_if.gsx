package views

component C(c bool, v string) { <div style={ if c { css`color: @{v}` } else { "color: gray" } }>x</div> }
