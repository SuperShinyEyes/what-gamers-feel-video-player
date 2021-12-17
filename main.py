#!/usr/bin/env python3

import os
from typing import *
from pathlib import PosixPath
import pdb

from flask import Flask, render_template, request
import pandas as pd
import numpy as np

import settings
import utils

app = Flask(__name__)


class Data(object):
    def __init__(self, df: pd.core.frame.DataFrame):
        self.df = df

    @classmethod
    def from_video_id_and_annotation_id(
        cls,
        video_id: int,
        annotation_id: int,
        path=settings.PATHS.annotations / f"annotation.pkl",
    ):
        def get_extended_label_fnames(video_id, annotation_id) -> List[str]:
            extended_label_fnames = os.listdir(settings.PATHS.annotations_extended)
            extended_label_fnames = [
                fn
                for fn in extended_label_fnames
                if fn.startswith(f"annotator{annotation_id}-video{video_id}-v")
            ]
            return extended_label_fnames

        def has_extended_label(
            video_id,
            annotation_id,
        ) -> bool:
            if len(get_extended_label_fnames(video_id, annotation_id)) < 1:
                return False
            else:
                return True

        def get_extended_label_path(video_id, annotation_id) -> PosixPath:
            extended_label_fnames = get_extended_label_fnames(video_id, annotation_id)
            extended_label_fn = sorted(
                extended_label_fnames,
                key=lambda fn: int(fn.split("-v")[2].split(".")[0]),
                reverse=True,
            )[0]
            return settings.PATHS.annotations_extended / extended_label_fn

        if has_extended_label(video_id, annotation_id):
            path = get_extended_label_path(video_id, annotation_id)
            print(f"Load extended: {path}")
        df = pd.read_pickle(path)
        df = df[df["annotator_id"] == annotation_id]
        df = df[df["video_id"] == video_id]
        df = df.reset_index(drop=True)
        return cls(df)

    @classmethod
    def from_path(cls, path=settings.PATHS.annotations / f"annotation.pkl"):
        return cls(pd.read_pickle(path))

    @classmethod
    def from_video_id(
        cls, video_id, path=settings.PATHS.annotations / f"annotation.pkl"
    ):
        try:
            video_id = int(video_id)
        except ValueError:
            print(f"video_id must be integer number! You passed {video_id}")
            exit()

        df = pd.read_pickle(path)
        return cls(df[df["video_id"] == video_id])

    @property
    def name(self) -> str:
        return f"Unravel {self.video_id}"

    @property
    def video_path(self) -> str:
        path = f"/static/unravel{self.video_id}/unravel{self.video_id}.mp4"
        return path

    @property
    def video_id(self) -> str:
        return str(self.df["video_id"].unique()[0])

    @property
    def annotator_id(self) -> str:
        return str(self.df["annotator_id"].unique()[0])

    @property
    def annotator_ids(self):
        return self.df["annotator_id"].unique()

    @property
    def end_in_sec(self) -> pd.Series:
        return self.df["end_in_sec"]

    def __get_row_index(self, column_name: str, value) -> int:
        return self.df.index[self.df[column_name] == value][0]

    def __cast(self, column_name: str, target_dtype: type) -> None:
        self.df[column_name] = self.df[column_name].astype(target_dtype)

    def __update_timestamp_column(self, start_in_secs: List[str]) -> None:
        start_in_secs = [np.float64(sec) for sec in start_in_secs]

        for sec in start_in_secs:
            timestamp: str = utils.sec_to_timestamp(sec)
            try:
                row_index = self.__get_row_index("start_in_sec", sec)
            except IndexError:
                print(">>> Not updating timestamp column.")
                print(f"\t{timestamp}, {sec}")
                pass
            else:
                self.df.at[row_index, "timestamp"] = timestamp

    def __need_to_update_timestamp_column(self, value_column_name) -> bool:
        return value_column_name == "start_in_sec"

    def __update_column(self, update: Dict[str, str], column_name) -> None:
        """Update the dataframe with new column.

        Args:
            update:
        """
        assert isinstance(update, dict)
        if len(update) == 0:
            return None

        self.__cast(column_name, np.float64)

        for row_index, value in update.items():
            value = np.float64(value)
            self.df.at[int(row_index), column_name] = value

        return None

    def update(self, updates):

        timestamp_start: Dict[str, str] = updates["rowIndex_newstart"]
        timestamp_end: Dict[str, str] = updates["rowIndex_end"]
        print("New start_in_sec:", timestamp_start)
        print("New end_in_sec:", timestamp_end)

        self.__update_column(timestamp_start, "start_in_sec")
        self.__update_column(timestamp_end, "end_in_sec")

        self.__update_timestamp_column(timestamp_start.values())

    def save(self) -> None:
        def get_new_dataframe_path() -> PosixPath:

            prefix = f"annotator{self.annotator_id:s}-video{self.video_id:s}-v"
            older_versions = [
                p
                for p in os.listdir(settings.PATHS.annotations_extended)
                if p.startswith(prefix)
            ]
            new_version = len(older_versions) + 1
            suffix = f"{new_version}.pkl"

            new_fname = prefix + suffix
            return settings.PATHS.annotations_extended / new_fname

        filepath = get_new_dataframe_path()
        print(f"Save {filepath}")
        pd.to_pickle(self.df, filepath)


# ------------------------------------------------------------------------
# Backend server


@app.route("/unravel<int:video_id>")
def view_data(video_id):
    data = Data(video_id)
    return render_template("view_data.html", data=data)
    # return render_template('view_data.html', title=data.title video_path=data.video)


@app.route(
    "/annotate-video=<int:video_id>-annotator=<int:annotator_id>",
    methods=["GET", "POST"],
)
def annotate_video(video_id, annotator_id):
    data = Data.from_video_id_and_annotation_id(video_id, annotator_id)

    if request.method == "POST":
        print("Incoming..")
        # import pdb; pdb.set_trace()
        data.update(request.get_json())
        data.save()

        return "OK"
    else:
        return render_template("annotate.html", data=data, annotator_id=annotator_id)


@app.route("/compare-humans=<int:video_id>", methods=["GET"])
def compare_annotations_video(video_id):
    data = Data.from_video_id(
        video_id, path=settings.PATHS.annotations_start_end_dataframe
    )

    return render_template("compare.html", data=data)


def parse_prediction_pickle_filename(filename: str) -> Dict[str, str]:
    filename = filename.split(".pkl")[0]
    key_value_list = filename.split("-")
    key_value_list = [key_value.split("=") for key_value in key_value_list]
    print(key_value_list)
    # pdb.set_trace()
    return dict(key_value_list)


@app.route("/view-prediction=<string:filename>", methods=["GET"])
def view_prediction(filename):
    # Load prediction dataframe from disk
    path = settings.PATHS.annotations_predicted / filename
    assert path.exists()
    prediction: pd.core.frame.DataFrame = pd.read_pickle(path)

    # Load human annotation datafrom from disk
    prediction_config_dict: Dict = parse_prediction_pickle_filename(filename)
    data = Data.from_video_id(
        prediction_config_dict["video_id"],
        path=settings.PATHS.annotations_start_end_dataframe,
    )

    # Merge the human and machine annotations
    data.df = pd.concat([data.df, prediction])

    granularity: int = int(prediction_config_dict["granularity"])

    if granularity == 1:
        return render_template(
            "view_prediction.html",
            data=data,
            prediction=prediction,
            prediction_filename=filename,
            granularity=granularity,
        )
    elif granularity == 2:
        return render_template(
            "view_prediction.html",
            data=data,
            prediction=prediction,
            prediction_filename=filename,
            granularity=granularity,
        )
    elif granularity == 3:
        return render_template(
            "view_prediction.html",
            data=data,
            prediction=prediction,
            prediction_filename=filename,
            granularity=granularity,
        )
    elif granularity == 4:
        return render_template(
            "view_prediction.html",
            data=data,
            prediction=prediction,
            prediction_filename=filename,
            granularity=granularity,
        )
    else:
        raise ValueError(f"Unknown granularity: {granularity}")
    return render_template(
        "view_prediction.html",
        data=data,
        prediction=prediction,
        prediction_filename=filename,
    )


@app.route("/predictions", methods=["GET"])
def enumerate_predictions():
    """Enumerate all prediction dataframe file names."""
    prediction_dataframe_pickles = [
        p
        for p in settings.PATHS.annotations_predicted.iterdir()
        if str(p).endswith(".pkl")
    ]
    prediction_dataframe_pickles = [p.name for p in prediction_dataframe_pickles]
    prediction_kwargs = [
        parse_prediction_pickle_filename(filename)
        for filename in prediction_dataframe_pickles
    ]
    print(prediction_dataframe_pickles)
    return render_template(
        "predictions.html", data=zip(prediction_dataframe_pickles, prediction_kwargs)
    )


@app.route("/")
def main():
    df = Data.from_path().df
    annotator_video: List[Tuple[int, int]] = []
    for i, row in df.drop_duplicates(["video_id", "annotator_id"])[
        ["video_id", "annotator_id"]
    ].iterrows():
        annotator_video.append(tuple((row[1], row[0])))
    return render_template("index.html", annotator_video=annotator_video)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
