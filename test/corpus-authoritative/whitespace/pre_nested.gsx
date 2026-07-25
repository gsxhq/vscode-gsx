package views

const snippet = `go install example.com/tool@latest
tool init`

component PreNested(lines []string) {
	<pre class="snippet"><code>{ snippet }</code></pre>
	<pre><code>
  <span>indented</span> tail
</code></pre>
	<pre>{ if len(lines) > 0 { <b>{ lines[0] }</b> } }</pre>
	<pre>{ for _, l := range lines { <span>{ l }</span> } }</pre>
	<pre>{ if len(lines) > 1 { <b>a</b>
mid
<b>b</b> } }</pre>
	<pre>{ switch len(lines) {
	case 0:
		<i>empty</i>
	default:
		<i>a</i>
raw
<i>b</i>
	} }</pre>
	<pre><><span>x</span>
between
<span>y</span></></pre>
	<textarea name="t">
  keeps   spaces
</textarea>
}
