// Do not edit. Bootstrap copy of /private/tmp/go-20171004-32030-1lwkjbw/go/src/cmd/compile/internal/gc/reflect_test.go

//line /private/tmp/go-20171004-32030-1lwkjbw/go/src/cmd/compile/internal/gc/reflect_test.go:1
// Copyright 2015 The Go Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package gc

import (
	"bootstrap/cmd/compile/internal/types"
	"bootstrap/cmd/internal/obj"
	"reflect"
	"testing"
)

func TestSortingBySigLT(t *testing.T) {
	data := []*Sig{
		&Sig{name: "b", pkg: &types.Pkg{Path: "abc"}},
		&Sig{name: "b", pkg: nil},
		&Sig{name: "c", pkg: nil},
		&Sig{name: "c", pkg: &types.Pkg{Path: "uvw"}},
		&Sig{name: "c", pkg: nil},
		&Sig{name: "b", pkg: &types.Pkg{Path: "xyz"}},
		&Sig{name: "a", pkg: &types.Pkg{Path: "abc"}},
		&Sig{name: "b", pkg: nil},
	}
	want := []*Sig{
		&Sig{name: "a", pkg: &types.Pkg{Path: "abc"}},
		&Sig{name: "b", pkg: nil},
		&Sig{name: "b", pkg: nil},
		&Sig{name: "b", pkg: &types.Pkg{Path: "abc"}},
		&Sig{name: "b", pkg: &types.Pkg{Path: "xyz"}},
		&Sig{name: "c", pkg: nil},
		&Sig{name: "c", pkg: nil},
		&Sig{name: "c", pkg: &types.Pkg{Path: "uvw"}},
	}
	if len(data) != len(want) {
		t.Fatal("want and data must match")
	}
	if reflect.DeepEqual(data, want) {
		t.Fatal("data must be shuffled")
	}
	obj.SortSlice(data, func(i, j int) bool { return siglt(data[i], data[j]) })
	if !reflect.DeepEqual(data, want) {
		t.Logf("want: %#v", want)
		t.Logf("data: %#v", data)
		t.Errorf("sorting failed")
	}
}
