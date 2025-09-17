#!/usr/bin/env python3

# this script has two modes: start and stop, which is determined by the `KMVAR_Local_Task_Mode` environment variable.
# start mode: it checks the `KMVAR_Local_Task_Label` environment variable to determine the current task label, then stops the currently running event (if any) and creates a new stopwatch event with that label in activitywatch using the activitywatch api. it then prints `task started: {task_label}` to the console.
# stop mode: it stops the most recent event and prints `task stopped: {task_label}` to the console.


import os
import json
import urllib.request
import sys

# MODE = "start"
# MODE = "stop"

# region system


def exit_with_error_message(msg):
    print(msg, file=sys.stderr)
    sys.exit(1)


def call_api(endpoint, dict_data=None, params=None, method="GET"):
    # define the url and headers for the request
    base_url = "http://localhost:5600/api/0/buckets/"
    # base_url = 'http://localhost:5600/api/0/buckets/aw-stopwatch/'
    headers = {"Content-Type": "application/json"}
    url = f"{base_url}{endpoint}"

    # define the data to be sent in the request body.
    data = json.dumps(dict_data).encode("utf-8")

    # if params are provided, encode them and append to the url
    if params:
        query = urllib.parse.urlencode(params, doseq=True, safe=":+")
        sep = "&" if "?" in url else "?"
        url = f"{url}{sep}{query}"

    # create and send the request.
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        response = urllib.request.urlopen(request)
    except urllib.error.HTTPError as err:
        exit_with_error_message(f"HTTP error occurred: {err.code} - {err.reason}")
    except urllib.error.URLError as err:
        exit_with_error_message(f"Failed to reach the server: {err.reason}")
    except Exception as err:
        exit_with_error_message(f"An error occurred: {err}")

    # Read and decode the response.
    response_text = response.read().decode()

    # Parse the JSON response.
    try:
        response_data = json.loads(response_text)
    except json.JSONDecodeError:
        exit_with_error_message("Failed to parse the response as JSON.")
    except Exception as err:
        exit_with_error_message(f"An error occurred: {err}")

    return response_data


# endregion system

# region activitywatch


from datetime import datetime, timezone


def get_bucket_events(bucket_id, start=None, end=None, limit=None):
    """
    Fetch events from the specified bucket using a GET request.
    """
    endpoint = f"{bucket_id}/events"
    params = {}
    if start is not None:
        params["start"] = start.isoformat()
    if end is not None:
        params["end"] = end.isoformat()
    if limit is not None:
        params["limit"] = str(limit)

    response = call_api(endpoint, params=params)

    return response


def stopwatch_stop_event(raise_data_errors=True) -> dict:
    """Stop the stopwatch timer by sending a PUT request to update the event."""
    # get the original event data
    event_data = get_bucket_events("aw-stopwatch", limit=1)

    if not event_data:
        if raise_data_errors:
            exit_with_error_message("No events found")
        else:
            return {}
    #
    event_data = event_data[0]
    #
    if event_data and event_data["data"]["running"] is False:
        if raise_data_errors:
            exit_with_error_message("No tasks are running")
        else:
            return {}

    # calculate new duration
    iso_now = datetime.now(timezone.utc)
    iso_start = datetime.fromisoformat(event_data["timestamp"].replace("Z", "+00:00"))
    duration = (iso_now - iso_start).total_seconds()

    # format the update call
    # url = f"http://localhost:5600/api/0/buckets/aw-stopwatch/events/{event_id}"
    endpoint = f"aw-stopwatch/heartbeat?pulsetime=1"
    # url = f"http://localhost:5600/api/0/buckets/aw-stopwatch/events"
    payload = {
        "id": event_data["id"],
        "timestamp": event_data["timestamp"],
        "duration": duration,
        "data": {"running": False, "label": event_data["data"]["label"]},
    }
    response = call_api(endpoint, dict_data=payload, method="POST")
    return response


def stopwatch_create_event(label: str = "not specified") -> dict:
    """Create a new stopwatch event by sending a POST request."""
    # stop the previous task
    stopwatch_stop_event(raise_data_errors=False)
    #
    iso_now = datetime.now(timezone.utc).isoformat()
    endpoint = "aw-stopwatch/events"
    payload = {
        "timestamp": iso_now,
        "data": {"running": True, "label": label},
    }
    response = call_api(endpoint, dict_data=payload, method="POST")

    return response


# endregion activitywatch


# Extract and print the assistant's message.
try:

    MODE = os.environ.get("KMVAR_Local_Task_Mode", "unspecified")

    if MODE not in ["start", "stop"]:
        exit_with_error_message(
            f"invalid or missing mode({MODE}). must be 'start' or 'stop'."
        )

    if MODE == "start":

        # the label for the task
        task_label = os.environ.get("KMVAR_Local_Task_Label", "unspecified")

        # ensure environment variables are set
        if not task_label:
            exit_with_error_message("Missing Task Label.")

        # create a new stopwatch event
        message = stopwatch_create_event(label=task_label)

        # action
        action = "started"

    if MODE == "stop":

        # stop the event
        message = stopwatch_stop_event()
        # extract the label
        task_label = message["data"]["label"]

        # action
        action = "stopped"

except (KeyError, TypeError, IndexError) as e:
    exit_with_error_message(f"Unexpected structure in the response JSON: {e}")
except Exception as err:
    exit_with_error_message(f"An error occurred: {err}")

# clear the environment variables so that they don't persist for the next run
os.environ["KMVAR_Local_Task_Mode"] = ""
os.environ["KMVAR_Local_Task_Label"] = ""

print(f"task {action}: {task_label}")
