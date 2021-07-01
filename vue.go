package vue

import (
	"embed"
	"io/fs"
)

//go:embed packages/template/* packages/template/**
var app embed.FS

// Boilerplate is a vue app starter for Cosmos SDK chains.
func Boilerplate() fs.FS {
	f, _ := fs.Sub(app, "packages/template")
	return f
}
