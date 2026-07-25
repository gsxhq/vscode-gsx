package views

component Pick(k string) {
	<div>{ switch k {
	case "a":
		one - {k} <br/>
	default:
		two - {k} <br/>
	} }</div>
}
