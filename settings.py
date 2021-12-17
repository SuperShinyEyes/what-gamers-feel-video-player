import os
from pathlib import Path, PosixPath
from typing import *


class Paths(NamedTuple):

    base = Path(os.path.dirname(os.path.abspath(__file__)))
    static = base / "static"

    annotations = static / "annotations"
    annotations_extended = static / "annotations-extended"
    annotations_predicted = static / "annotations-predicted"

    # Pickle files
    annotations_start_timestamp_only_dataframe = annotations / "annotation.pkl"
    annotations_start_end_dataframe = annotations / "annotation_merged_v1.pkl"


PATHS = Paths()
