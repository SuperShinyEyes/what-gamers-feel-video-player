#!/bin/bash

update_deps() {
    python3 -m pip install --upgrade pip wheel
    python3 -m pip install -r requirements.txt
}

if [[ ! -d "./venv" ]]
then
    echo "Setting up virtualenv."
    set -e
    python3 -m venv venv
    source venv/bin/activate
    update_deps
    deactivate
    set +e
fi

source venv/bin/activate
