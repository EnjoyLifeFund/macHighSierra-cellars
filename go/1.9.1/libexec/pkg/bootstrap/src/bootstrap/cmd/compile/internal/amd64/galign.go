// Do not edit. Bootstrap copy of /private/tmp/go-20171004-32030-1lwkjbw/go/src/cmd/compile/internal/amd64/galign.go

//line /private/tmp/go-20171004-32030-1lwkjbw/go/src/cmd/compile/internal/amd64/galign.go:1
// Copyright 2009 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package amd64

import (
	"bootstrap/cmd/compile/internal/gc"
	"bootstrap/cmd/internal/obj/x86"
	"bootstrap/cmd/internal/objabi"
)

var leaptr = x86.ALEAQ

func Init(arch *gc.Arch) {
	arch.LinkArch = &x86.Linkamd64
	if objabi.GOARCH == "amd64p32" {
		arch.LinkArch = &x86.Linkamd64p32
		leaptr = x86.ALEAL
	}
	arch.REGSP = x86.REGSP
	arch.MAXWIDTH = 1 << 50

	arch.ZeroRange = zerorange
	arch.ZeroAuto = zeroAuto
	arch.Ginsnop = ginsnop

	arch.SSAMarkMoves = ssaMarkMoves
	arch.SSAGenValue = ssaGenValue
	arch.SSAGenBlock = ssaGenBlock
}
