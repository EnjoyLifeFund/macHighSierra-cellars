#!/bin/bash
JAVA_HOME="${JAVA_HOME:-$(/usr/libexec/java_home)}" exec "/usr/local/Cellar/maven/3.5.0/libexec/bin/mvn.cmd" "$@"
