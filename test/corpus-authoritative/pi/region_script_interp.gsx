package views

component RegionScriptHole(v string) {
	<?start name="r">
		<script>const a = @{v};</script>
	<?end>
	<div>
		<script>const a = @{v};</script>
	</div>
}
