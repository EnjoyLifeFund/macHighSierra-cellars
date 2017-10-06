// Do not edit. Bootstrap copy of /private/tmp/go-20171004-32030-1lwkjbw/go/src/cmd/compile/internal/gc/trace.go

//line /private/tmp/go-20171004-32030-1lwkjbw/go/src/cmd/compile/internal/gc/trace.go:1
// Copyright 2016 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

// +build go1.7

package gc

import (
	"os"
	tracepkg "runtime/trace"
)

func init() {
	traceHandler = traceHandlerGo17
}

func traceHandlerGo17(traceprofile string) {
	f, err := os.Create(traceprofile)
	if err != nil {
		Fatalf("%v", err)
	}
	if err := tracepkg.Start(f); err != nil {
		Fatalf("%v", err)
	}
	atExit(tracepkg.Stop)
}
