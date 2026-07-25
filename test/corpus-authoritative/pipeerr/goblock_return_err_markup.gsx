package views

import "context"

func label(ctx context.Context, k string) (string, error) {
	return "L:" + k, nil
}

component Row(k string) {
	{{
		v, err := label(ctx, k)
		if err != nil {
			return err
		}
	}}
	<p>{ v }</p>
}
