package p

component Frag() {
	<?start name="a">hi</>
}

component EarlyClose() {
	<?start name="a">hi</><?end>
}

component WrongTag() {
	<?start name="a">hi</div>
}
