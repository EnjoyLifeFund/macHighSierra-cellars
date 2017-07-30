// Do not edit. Bootstrap copy of /private/tmp/go-20170609-86481-z7fj3v/go/src/cmd/compile/internal/arm/galign.go

//line /private/tmp/go-20170609-86481-z7fj3v/go/src/cmd/compile/internal/arm/galign.go:1
// Copyright 2009 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package arm

import (
	"bootstrap/cmd/compile/internal/gc"
	"bootstrap/cmd/compile/internal/ssa"
	"bootstrap/cmd/internal/obj/arm"
)

func Init() {
	gc.Thearch.LinkArch = &arm.Linkarm
	gc.Thearch.REGSP = arm.REGSP
	gc.Thearch.MAXWIDTH = (1 << 32) - 1

	gc.Thearch.Defframe = defframe
	gc.Thearch.Proginfo = proginfo

	gc.Thearch.SSAMarkMoves = func(s *gc.SSAGenState, b *ssa.Block) {}
	gc.Thearch.SSAGenValue = ssaGenValue
	gc.Thearch.SSAGenBlock = ssaGenBlock
	gc.Thearch.ZeroAuto = zeroAuto
}
