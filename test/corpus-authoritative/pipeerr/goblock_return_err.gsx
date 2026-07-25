package views

import "context"

func lookupID(ctx context.Context, key string) (string, error) {
	return "id-" + key, nil
}

component Inner(id string) {
	<span>{ id }</span>
}

type Page struct{}

component (p Page) Card(key string) {
	{{
		id, err := lookupID(ctx, key)
		if err != nil {
			return err
		}
	}}
	<Inner id={id}/>
}
