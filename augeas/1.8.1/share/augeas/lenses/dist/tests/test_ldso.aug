(*
Module: Test_Ldso
  Provides unit tests and examples for the <Ldso> lens.
*)

module Test_Ldso =

(* Variable: conf *)
let conf = "include /etc/ld.so.conf.d/*.conf

# libc default configuration
/usr/local/lib

hwcap 1 nosegneg
"

(* Test: Ldso.lns *)
test Ldso.lns get conf =
   { "include" = "/etc/ld.so.conf.d/*.conf" }
   { }
   { "#comment" = "libc default configuration" }
   { "path" = "/usr/local/lib" }
   { }
   { "hwcap"
     { "bit" = "1" }
     { "name" = "nosegneg" } }
