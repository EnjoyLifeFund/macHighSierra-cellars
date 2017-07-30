// Do not edit. Bootstrap copy of /private/tmp/go-20170609-86481-z7fj3v/go/src/cmd/asm/internal/arch/amd64.go

//line /private/tmp/go-20170609-86481-z7fj3v/go/src/cmd/asm/internal/arch/amd64.go:1
// Copyright 2016 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

// This file encapsulates some of the odd characteristics of the
// AMD64 instruction set, to minimize its interaction
// with the core of the assembler.

package arch

import (
	"bootstrap/cmd/internal/obj"
	"bootstrap/cmd/internal/obj/x86"
)

// IsAMD4OP reports whether the op (as defined by an amd64.A* constant) is
// a 4-operand instruction.
func IsAMD4OP(op obj.As) bool {
	switch op {
	case x86.AVPERM2F128,
		x86.AVPALIGNR,
		x86.AVPERM2I128,
		x86.AVINSERTI128,
		x86.AVPBLENDD:
		return true
	}
	return false
}
