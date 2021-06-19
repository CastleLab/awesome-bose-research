#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

title="Awesome BoSE Research"
description="Literature for blockchain-oriented software engineering (BoSE) research."
out="$DIR"/../docs

"$DIR"/../node_modules/.bin/paper-list build -t "$title" -d "$description" -o "$out" "$DIR"/../paper-list.js
