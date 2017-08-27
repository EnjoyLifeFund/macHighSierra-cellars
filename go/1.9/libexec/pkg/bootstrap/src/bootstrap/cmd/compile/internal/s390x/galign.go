// Do not edit. Bootstrap copy of /private/tmp/go-20170825-7962-1spqumn/go/src/cmd/compile/internal/s390x/galign.go

//line /private/tmp/go-20170825-7962-1spqumn/go/src/cmd/compile/internal/s390x/galign.go:1
// Copyright 2016 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package s390x

import (
	"bootstrap/cmd/compile/internal/gc"
	"bootstrap/cmd/internal/obj/s390x"
)

func Init(arch *gc.Arch) {
	arch.LinkArch = &s390x.Links390x
	arch.REGSP = s390x.REGSP
	arch.MAXWIDTH = 1 << 50

	arch.ZeroRange = zerorange
	arch.ZeroAuto = zeroAuto
	arch.Ginsnop = ginsnop

	arch.SSAMarkMoves = ssaMarkMoves
	arch.SSAGenValue = ssaGenValue
	arch.SSAGenBlock = ssaGenBlock
}
