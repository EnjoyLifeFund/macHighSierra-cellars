// Do not edit. Bootstrap copy of /private/tmp/go-20170609-86481-z7fj3v/go/src/cmd/compile/internal/ppc64/galign.go

//line /private/tmp/go-20170609-86481-z7fj3v/go/src/cmd/compile/internal/ppc64/galign.go:1
// Copyright 2009 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package ppc64

import (
	"bootstrap/cmd/compile/internal/gc"
	"bootstrap/cmd/internal/obj"
	"bootstrap/cmd/internal/obj/ppc64"
)

func Init() {
	gc.Thearch.LinkArch = &ppc64.Linkppc64
	if obj.GOARCH == "ppc64le" {
		gc.Thearch.LinkArch = &ppc64.Linkppc64le
	}
	gc.Thearch.REGSP = ppc64.REGSP
	gc.Thearch.MAXWIDTH = 1 << 50

	gc.Thearch.Defframe = defframe
	gc.Thearch.Proginfo = proginfo

	gc.Thearch.SSAMarkMoves = ssaMarkMoves
	gc.Thearch.SSAGenValue = ssaGenValue
	gc.Thearch.SSAGenBlock = ssaGenBlock
	gc.Thearch.ZeroAuto = zeroAuto

	initvariants()
	initproginfo()
}
