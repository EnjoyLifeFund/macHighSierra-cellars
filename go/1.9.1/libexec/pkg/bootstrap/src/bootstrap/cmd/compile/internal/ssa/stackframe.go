// Do not edit. Bootstrap copy of /private/tmp/go-20171004-32030-1lwkjbw/go/src/cmd/compile/internal/ssa/stackframe.go

//line /private/tmp/go-20171004-32030-1lwkjbw/go/src/cmd/compile/internal/ssa/stackframe.go:1
// Copyright 2016 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package ssa

// stackframe calls back into the frontend to assign frame offsets.
func stackframe(f *Func) {
	f.fe.AllocFrame(f)
}
