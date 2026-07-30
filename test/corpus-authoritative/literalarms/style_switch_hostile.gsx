package views

component C(n int, w string) { <div style={ switch n { case 1: css`aspect-ratio: @{w} / 9` default: css`aspect-ratio: @{w}` } }>x</div> }
