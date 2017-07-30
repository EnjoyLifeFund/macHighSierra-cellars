// Do not edit. Bootstrap copy of /private/tmp/go-20170609-86481-z7fj3v/go/src/cmd/compile/internal/s390x/galign.go

//line /private/tmp/go-20170609-86481-z7fj3v/go/src/cmd/compile/internal/s390x/galign.go:1
// Copyright 2016 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package s390x

import (
	"bootstrap/cmd/compile/internal/gc"
	"bootstrap/cmd/internal/obj/s390x"
)

func Init() {
	gc.Thearch.LinkArch = &s390x.Links390x
	gc.Thearch.REGSP = s390x.REGSP
	gc.Thearch.MAXWIDTH = 1 << 50

	gc.Thearch.Defframe = defframe
	gc.Thearch.Proginfo = proginfo

	gc.Thearch.SSAMarkMoves = ssaMarkMoves
	gc.Thearch.SSAGenValue = ssaGenValue
	gc.Thearch.SSAGenBlock = ssaGenBlock
	gc.Thearch.ZeroAuto = zeroAuto
}
