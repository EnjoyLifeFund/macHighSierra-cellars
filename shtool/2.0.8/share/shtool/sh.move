##
##  move -- Move files with simultaneous substitution
##  Copyright (c) 1999-2008 Ralf S. Engelschall <rse@engelschall.com>
##
##  This file is part of shtool and free software; you can redistribute
##  it and/or modify it under the terms of the GNU General Public
##  License as published by the Free Software Foundation; either version
##  2 of the License, or (at your option) any later version.
##
##  This file is distributed in the hope that it will be useful,
##  but WITHOUT ANY WARRANTY; without even the implied warranty of
##  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
##  General Public License for more details.
##
##  You should have received a copy of the GNU General Public License
##  along with this program; if not, write to the Free Software
##  Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307,
##  USA, or contact Ralf S. Engelschall <rse@engelschall.com>.
##

str_tool="move"
str_usage="[-v|--verbose] [-t|--trace] [-e|--expand] [-p|--preserve] <src-file> <dst-file>"
arg_spec="2="
opt_spec="v.t.e.p."
opt_alias="v:verbose,t:trace,e:expand,p:preserve"
opt_v=no
opt_t=no
opt_e=no
opt_p=no

. ./sh.common

src="$1"
dst="$2"

#   consistency checks
if [ ".$src" = . ] || [ ".$dst" = . ]; then
    echo "$msgprefix:Error: Invalid arguments" 1>&2
    shtool_exit 1
fi
if [ ".$src" = ".$dst" ]; then
    echo "$msgprefix:Error: Source and destination files are the same" 1>&2
    shtool_exit 1
fi
expsrc="$src"
if [ ".$opt_e" = .yes ]; then
    expsrc="`echo $expsrc`"
fi
if [ ".$opt_e" = .yes ]; then
    if [ ".`echo "$src" | sed -e 's;^.*\\*.*$;;'`" = ".$src" ]; then
        echo "$msgprefix:Error: Source doesn't contain wildcard ('*'): $dst" 1>&2
        shtool_exit 1
    fi
    if [ ".`echo "$dst" | sed -e 's;^.*%[1-9].*$;;'`" = ".$dst" ]; then
        echo "$msgprefix:Error: Destination doesn't contain substitution ('%N'): $dst" 1>&2
        shtool_exit 1
    fi
    if [ ".$expsrc" = ".$src" ]; then
        echo "$msgprefix:Error: Sources not found or no asterisk : $src" 1>&2
        shtool_exit 1
    fi
else
    if [ ! -r "$src" ]; then
        echo "$msgprefix:Error: Source not found: $src" 1>&2
        shtool_exit 1
    fi
fi

#   determine substitution patterns
if [ ".$opt_e" = .yes ]; then
    srcpat=`echo "$src" | sed -e 's/\\./\\\\./g' -e 's/;/\\;/g' -e 's;\\*;\\\\(.*\\\\);g'`
    dstpat=`echo "$dst" | sed -e 's;%\([1-9]\);\\\\\1;g'`
fi

#   iterate over source(s)
for onesrc in $expsrc; do
    if [ .$opt_e = .yes ]; then
        onedst=`echo $onesrc | sed -e "s;$srcpat;$dstpat;"`
    else
        onedst="$dst"
    fi
    errorstatus=0
    if [ ".$opt_v" = .yes ]; then
        echo "$onesrc -> $onedst"
    fi
    if [ ".$opt_p" = .yes ]; then
        if [ -r $onedst ]; then
            if cmp -s $onesrc $onedst; then
                if [ ".$opt_t" = .yes ]; then
                    echo "rm -f $onesrc" 1>&2
                fi
                rm -f $onesrc || errorstatus=$?
            else
                if [ ".$opt_t" = .yes ]; then
                    echo "mv -f $onesrc $onedst" 1>&2
                fi
                mv -f $onesrc $onedst || errorstatus=$?
            fi
        else
            if [ ".$opt_t" = .yes ]; then
                echo "mv -f $onesrc $onedst" 1>&2
            fi
            mv -f $onesrc $onedst || errorstatus=$?
        fi
    else
        if [ ".$opt_t" = .yes ]; then
            echo "mv -f $onesrc $onedst" 1>&2
        fi
        mv -f $onesrc $onedst || errorstatus=$?
    fi
    if [ $errorstatus -ne 0 ]; then
        break;
    fi
done

shtool_exit $errorstatus

##
##  manual page
##

=pod

=head1 NAME

B<shtool move> - B<GNU shtool> enhanced mv(1) replacement

=head1 SYNOPSIS

B<shtool move>
[B<-v>|B<--verbose>]
[B<-t>|B<--trace>]
[B<-e>|B<--expand>]
[B<-p>|B<--preserve>]
I<src-file>
I<dst-file>

=head1 DESCRIPTION

This is a mv(1) style command enhanced with the ability to rename
multiple files in a single operation and the ability to detect and not
touch existing equal destinations files, thus preserving timestamps.

=head1 OPTIONS

The following command line options are available.

=over 4

=item B<-v>, B<--verbose>

Display some processing information.

=item B<-t>, B<--trace>

Enable the output of the essential shell commands which are executed.

=item B<-e>, B<--expand>

Expand asterisk in I<src> to be used as "C<%>I<n>" (where I<n> is
C<1>,C<2>,...) in I<dst-file>. This is useful for renaming multiple
files at once.

=item B<-p>, B<--preserve>

Detect I<src-file> and I<dst-file> having equal content and not touch
existing destination files, thus perserving timestamps. This is useful
for applications that monitor timestamps, i.e. suppress make(1L)
repeating actions for unchanged files.

=back

=head1 EXAMPLE

 #   shell script
 shtool move -v -e '*.txt' %1.asc

 #   Makefile
 scanner.c: scanner.l
     lex scanner.l
     shtool move -t -p lex.yy.c scanner.c

=head1 HISTORY

The B<GNU shtool> B<move> command was originally written by Ralf S.
Engelschall E<lt>rse@engelschall.comE<gt> in 1999 for B<GNU shtool>.

=head1 SEE ALSO

shtool(1), mv(1), make(1).

=cut

