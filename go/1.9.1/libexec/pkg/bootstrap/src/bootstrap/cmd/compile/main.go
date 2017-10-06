// Do not edit. Bootstrap copy of /private/tmp/go-20171004-32030-1lwkjbw/go/src/cmd/compile/main.go

//line /private/tmp/go-20171004-32030-1lwkjbw/go/src/cmd/compile/main.go:1
// Copyright 2015 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"bootstrap/cmd/compile/internal/amd64"
	"bootstrap/cmd/compile/internal/arm"
	"bootstrap/cmd/compile/internal/arm64"
	"bootstrap/cmd/compile/internal/gc"
	"bootstrap/cmd/compile/internal/mips"
	"bootstrap/cmd/compile/internal/mips64"
	"bootstrap/cmd/compile/internal/ppc64"
	"bootstrap/cmd/compile/internal/s390x"
	"bootstrap/cmd/compile/internal/x86"
	"bootstrap/cmd/internal/objabi"
	"fmt"
	"log"
	"os"
)

var archInits = map[string]func(*gc.Arch){
	"386":      x86.Init,
	"amd64":    amd64.Init,
	"amd64p32": amd64.Init,
	"arm":      arm.Init,
	"arm64":    arm64.Init,
	"mips":     mips.Init,
	"mipsle":   mips.Init,
	"mips64":   mips64.Init,
	"mips64le": mips64.Init,
	"ppc64":    ppc64.Init,
	"ppc64le":  ppc64.Init,
	"s390x":    s390x.Init,
}

func main() {
	// disable timestamps for reproducible output
	log.SetFlags(0)
	log.SetPrefix("compile: ")

	archInit, ok := archInits[objabi.GOARCH]
	if !ok {
		fmt.Fprintf(os.Stderr, "compile: unknown architecture %q\n", objabi.GOARCH)
		os.Exit(2)
	}

	gc.Main(archInit)
	gc.Exit(0)
}
