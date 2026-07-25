package views

component RegionGoBlock(v string) {
	<?start name="r">
		{{
			h := js`f(@{v})`
			s := css`color: @{v};`
		}}
		<div @click={h} style={s}>x</div>
	<?end>
}
