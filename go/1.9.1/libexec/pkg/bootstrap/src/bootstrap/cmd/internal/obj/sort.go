// Do not edit. Bootstrap copy of /private/tmp/go-20171004-32030-1lwkjbw/go/src/cmd/internal/obj/sort.go

//line /private/tmp/go-20171004-32030-1lwkjbw/go/src/cmd/internal/obj/sort.go:1
// Copyright 2017 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

// +build go1.8

package obj

import "sort"

func SortSlice(slice interface{}, less func(i, j int) bool) {
	sort.Slice(slice, less)
}
