package views

import "corpustest/cases/pi_marker_renderer/pg"

func mkID(s string) pg.ID { return pg.ID{Raw: s} }

component Marked(v pg.ID) {
	<?marker name={v}>
	<p>{v}</p>
}
