package views

component Field[T string | bool](required T) {
	<input required={required} />
}

component Page() {
	<Field[bool] required={true} />
	<Field[bool] required={false} />
	<Field[string] required={"foo"} />
}
