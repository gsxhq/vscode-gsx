package views

component Escaped(text, attr, nav, candidates, scriptValue, cssValue string) {
	<div title={ attr }>{ text }</div>
	<a href={ nav }>nav</a>
	<img srcset={ candidates }/>
	<button onclick=js`show(@{scriptValue})` style=css`content:@{cssValue}`>go</button>
}

component Page() {
	<Escaped
		text={ `<b>&` }
		attr={ `"&` }
		nav={ `javascript:alert(1)` }
		candidates={ `javascript:bad 1x, /ok.png 2x` }
		scriptValue={ `'</script>` }
		cssValue={ `</style>` }
	/>
}
