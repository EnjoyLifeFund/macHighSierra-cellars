#!/usr/bin/perl -w

#
# $Id: stop_epsilon_nodes.pl,v 1.5 2010/02/05 23:50:23 simakov Exp $
#
# EPSILON - wavelet image compression library.
# Copyright (C) 2006,2007,2010 Alexander Simakov, <xander@entropyware.info>
#
# This file is part of EPSILON
#
# EPSILON is free software: you can redistribute it and/or modify
# it under the terms of the GNU Lesser General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# EPSILON is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Lesser General Public License for more details.
#
# You should have received a copy of the GNU Lesser General Public License
# along with EPSILON.  If not, see <http://www.gnu.org/licenses/>.
#
# http://epsilon-project.sourceforge.net
#

use strict;
use warnings;

sub stop_nodes {
    my ($epsilon_nodes) = @_;

    open F, $epsilon_nodes or die "$epsilon_nodes: $!";
    my @machines = ();

    while (my $line = <F>) {
        if ($line =~ /^(.*?\@.*?):/) {
            my $login = $1;
            push @machines, $login;
        }
    }

    if (@machines) {
        system('dsh', '-m', join(',', @machines), 'killall', 'epsilon');
    }

    close F;
}

sub Main {
    my $epsilon_nodes;

    if (@ARGV == 1) {
        $epsilon_nodes = $ARGV[0];
    } elsif (-e ".epsilon.nodes") {
        $epsilon_nodes = ".epsilon.nodes";
    } elsif (-e "$ENV{HOME}/.epsilon.nodes") {
        $epsilon_nodes = "$ENV{HOME}/.epsilon.nodes";
    } else {
        print <<EOF;
This is a script for stopping EPSILON nodes using DSH (Distributed SHell).
Host configuration is taken from so called `.epsilon.nodes' file.

By default, program checks `.epsilon.nodes' in the current directory.
If there is no such file, program tries `.epsilon.nodes' in user`s home
directory, i.e. \$HOME/.epsilon.nodes. You can also explicitly specify
file location as an argument to `stop_epsilon_nodes.pl' script.
EOF
        exit(1);
    }

    print "Using $epsilon_nodes\n";
    stop_nodes($epsilon_nodes);
}

Main();
