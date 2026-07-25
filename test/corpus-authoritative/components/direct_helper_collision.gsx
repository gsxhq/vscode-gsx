package views

component Child(value string) { <span>{ value }</span> }
component Page() { <Child value="suffix"/> }
