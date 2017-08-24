#!/usr/bin/env bash

# This file must be sourced in bash:
#
#   source `which env_parallel.bash`
#
# after which 'env_parallel' works
#
#
# Copyright (C) 2016,2017
# Ole Tange and Free Software Foundation, Inc.
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
# General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program; if not, see <http://www.gnu.org/licenses/>
# or write to the Free Software Foundation, Inc., 51 Franklin St,
# Fifth Floor, Boston, MA 02110-1301 USA

env_parallel() {
    # env_parallel.bash

    _names_of_ALIASES() {
	compgen -a
    }
    _bodies_of_ALIASES() {
	alias "$@"
    }
    _names_of_FUNCTIONS() {
	compgen -A function
    }
    _bodies_of_FUNCTIONS() {
	typeset -f "$@"
    }
    _names_of_VARIABLES() {
	compgen -A variable
    }
    _bodies_of_VARIABLES() {
	typeset -p "$@"
    }
    _remove_bad_NAMES() {
	# Do not transfer vars and funcs from env_parallel
	grep -Ev '^(_names_of_ALIASES|_bodies_of_ALIASES|_names_of_maybe_FUNCTIONS|_names_of_FUNCTIONS|_bodies_of_FUNCTIONS|_names_of_VARIABLES|_bodies_of_VARIABLES|_remove_bad_NAMES|_prefix_PARALLEL_ENV|_get_ignored_VARS|_make_grep_REGEXP|_ignore_UNDERSCORE|_alias_NAMES|_list_alias_BODIES|_function_NAMES|_list_function_BODIES|_variable_NAMES|_list_variable_VALUES|_prefix_PARALLEL_ENV|PARALLEL_TMP)$' |
	    # Filter names matching --env
	    grep -E "^$_grep_REGEXP"\$ | grep -vE "^$_ignore_UNDERSCORE"\$ |
            grep -vFf <(readonly) |
            grep -Ev '^(BASHOPTS|BASHPID|EUID|GROUPS|FUNCNAME|DIRSTACK|_|PIPESTATUS|PPID|SHELLOPTS|UID|USERNAME|BASH_[A-Z_]+)$'
    }
    _prefix_PARALLEL_ENV() {
        shopt 2>/dev/null |
        perl -pe 's:\s+off:;: and s/^/shopt -u /;
                  s:\s+on:;: and s/^/shopt -s /;
                  s:;$:&>/dev/null;:';
        echo 'shopt -s expand_aliases &>/dev/null';
    }

    _get_ignored_VARS() {
        perl -e '
            for(@ARGV){
                $next_is_env and push @envvar, split/,/, $_;
                $next_is_env=/^--env$/;
            }
            if(grep { /^_$/ } @envvar) {
                if(not open(IN, "<", "$ENV{HOME}/.parallel/ignored_vars")) {
             	    print STDERR "parallel: Error: ",
            	    "Run \"parallel --record-env\" in a clean environment first.\n";
                } else {
            	    chomp(@ignored_vars = <IN>);
            	    $vars = join "|",map { quotemeta $_ } "env_parallel", @ignored_vars;
		    print $vars ? "($vars)" : "(,,nO,,VaRs,,)";
                }
            }
            ' -- "$@"
    }

    # Get the --env variables if set
    # --env _ should be ignored
    # and convert  a b c  to (a|b|c)
    # If --env not set: Match everything (.*)
    _make_grep_REGEXP() {
        perl -e '
            for(@ARGV){
                /^_$/ and $next_is_env = 0;
                $next_is_env and push @envvar, split/,/, $_;
                $next_is_env = /^--env$/;
            }
            $vars = join "|",map { quotemeta $_ } @envvar;
            print $vars ? "($vars)" : "(.*)";
            ' -- "$@"
    }


    # Bash is broken in version 3.2.25 and 4.2.39
    # The crazy '[ "`...`" == "" ]' is needed for the same reason
    if [ "`which parallel`" == "" ]; then
	echo 'env_parallel: Error: parallel must be in $PATH.' >&2
	return 255
    fi

    # Grep regexp for vars given by --env
    _grep_REGEXP="`_make_grep_REGEXP \"$@\"`"

    # Deal with --env _
    _ignore_UNDERSCORE="`_get_ignored_VARS \"$@\"`"

    # --record-env
    # Bash is broken in version 3.2.25 and 4.2.39
    # The crazy '[ "`...`" == 0 ]' is needed for the same reason
    if [ "`perl -e 'exit grep { /^--record-env$/ } @ARGV' -- "$@"; echo $?`" == 0 ] ; then
	true skip
    else
	(_names_of_ALIASES;
	 _names_of_FUNCTIONS;
	 _names_of_VARIABLES) |
	    cat > $HOME/.parallel/ignored_vars
	return 0
    fi

    # Grep alias names
    _alias_NAMES="`_names_of_ALIASES | _remove_bad_NAMES`"
    _list_alias_BODIES="_bodies_of_ALIASES $_alias_NAMES"
    if [ "$_alias_NAMES" = "" ] ; then
	# no aliases selected
	_list_alias_BODIES="true"
    fi
    unset _alias_NAMES

    # Grep function names
    _function_NAMES="`_names_of_FUNCTIONS | _remove_bad_NAMES`"
    _list_function_BODIES="_bodies_of_FUNCTIONS $_function_NAMES"
    if [ "$_function_NAMES" = "" ] ; then
	# no functions selected
	_list_function_BODIES="true"
    fi
    unset _function_NAMES

    # Grep variable names
    _variable_NAMES="`_names_of_VARIABLES | _remove_bad_NAMES`"
    _list_variable_VALUES="_bodies_of_VARIABLES $_variable_NAMES"
    if [ "$_variable_NAMES" = "" ] ; then
	# no variables selected
	_list_variable_VALUES="true"
    fi
    unset _variable_NAMES

    _which_true="`which true`"
    # Copy shopt (so e.g. extended globbing works)
    # But force expand_aliases as aliases otherwise do not work
    PARALLEL_ENV="`
        _prefix_PARALLEL_ENV
        $_list_alias_BODIES;
        $_list_function_BODIES;
        $_list_variable_VALUES;
    `"
    export PARALLEL_ENV
    unset _list_alias_BODIES
    unset _list_variable_VALUES
    unset _list_function_BODIES
    # Test if environment is too big
    if [ "`which true`" == "$_which_true" ] ; then
	`which parallel` "$@";
	_parallel_exit_CODE=$?
	unset PARALLEL_ENV;
	return $_parallel_exit_CODE
    else
	unset PARALLEL_ENV;
	echo "env_parallel: Error: Your environment is too big." >&2
	echo "env_parallel: Error: Try running this in a clean environment once:" >&2
	echo "env_parallel: Error:   env_parallel --record-env" >&2
	echo "env_parallel: Error: And the use '--env _'" >&2
	echo "env_parallel: Error: For details see: man env_parallel" >&2

	return 255
    fi
}

parset() {
    # If $1 contains ',' or space:
    #   Split on , to get the destination variable names
    # If $1 is a single destination variable name:
    #   Treat it as the name of an array
    #
    #   # Create array named myvar
    #   parset myvar echo ::: {1..10}
    #   echo ${myvar[5]}
    #
    #   # Put output into $var_a $var_b $var_c
    #   varnames=(var_a var_b var_c)
    #   parset "${varnames[*]}" echo ::: {1..3}
    #   echo $var_c
    #
    #   # Put output into $var_a4 $var_b4 $var_c4
    #   parset "var_a4 var_b4 var_c4" echo ::: {1..3}
    #   echo $var_c4

    _parset_name="$1"
    shift
    if [ "$_parset_name" == "" ] ; then
	echo parset: Error: No destination variable given. >&2
	echo parset: Error: Try: >&2
	echo parset: Error: ' ' parset myvar echo ::: foo >&2
	return 255
    fi
    echo "$_parset_name" |
	perl -ne 'chomp;for (split /[, ]/) {
	    if(not /^[a-zA-Z_][a-zA-Z_0-9]*$/) {
                print STDERR "parset: Error: $_ is an invalid variable name.\n";
                print STDERR "parset: Error: Variable names must be letter followed by letters or digits.\n";
                $exitval = 255;
            }
        }
        exit $exitval;
        ' || return 255
    if echo "$_parset_name" | grep -E ',| ' >/dev/null ; then
	# $1 contains , or space
	# Split on , or space to get the names
	eval "$(
	    # Compute results into files
	    parallel --files -k "$@" |
		# var1=`cat tmpfile1; rm tmpfile1`
		# var2=`cat tmpfile2; rm tmpfile2`
		parallel -q echo {2}='`cat {1}; rm {1}`' :::: - :::+ $(
		    echo "$_parset_name" |
			perl -pe 's/,/ /g'
			 )
	    )"
    else
	# $1 contains no space or ,
	# => $1 is the name of the array to put data into
	eval $_parset_name="( $( parallel --files -k "$@" |
              perl -pe 'chop;$_="\"\`cat $_; rm $_\`\" "' ) )"
    fi
}
