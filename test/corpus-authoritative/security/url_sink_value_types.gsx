package views

type Path string

type Slug struct{ s string }

func (s Slug) String() string { return s.s }

component Types(a []byte, b Path, c Slug, d int, e []string) {
	<a href={a}>bytes</a>
	<a href={b}>named string</a>
	<a href={c}>stringer</a>
	<a href={d}>int</a>
	<a href={e}>string slice</a>
}

component Blocked(a []byte, c Slug) {
	<a href={a}>bytes</a>
	<a href={c}>stringer</a>
}

component Page() {
	<Types a={[]byte("/from-bytes")} b={Path("/named")} c={Slug{s: "/stringer"}} d={42} e={[]string{"/a", "b"}}/>
	<Blocked a={[]byte("javascript:alert(1)")} c={Slug{s: "javascript:alert(2)"}}/>
}
