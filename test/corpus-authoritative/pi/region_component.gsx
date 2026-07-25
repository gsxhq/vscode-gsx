package views

component Spinner() { <em>spin</em> }

component spinner() { <i>lower</i> }

component RegionCalls() {
	<?start name="feed">
		<Spinner/>
		<spinner/>
	<?end>
	<div>
		<Spinner/>
	</div>
}
