// Do not edit. Bootstrap copy of /private/tmp/go-20171004-32030-1lwkjbw/go/src/cmd/compile/internal/arm64/galign.go

//line /private/tmp/go-20171004-32030-1lwkjbw/go/src/cmd/compile/internal/arm64/galign.go:1
// Copyright 2009 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package arm64

import (
	"bootstrap/cmd/compile/internal/gc"
	"bootstrap/cmd/compile/internal/ssa"
	"bootstrap/cmd/internal/obj/arm64"
)

func Init(arch *gc.Arch) {
	arch.LinkArch = &arm64.Linkarm64
	arch.REGSP = arm64.REGSP
	arch.MAXWIDTH = 1 << 50

	arch.PadFrame = padframe
	arch.ZeroRange = zerorange
	arch.ZeroAuto = zeroAuto
	arch.Ginsnop = ginsnop

	arch.SSAMarkMoves = func(s *gc.SSAGenState, b *ssa.Block) {}
	arch.SSAGenValue = ssaGenValue
	arch.SSAGenBlock = ssaGenBlock
}
