# Custom Tools & Visualizations for ActivityWatch

This project is a work in progress. The visualizations were written with heavy ai assistance, so the implementation isn’t exactly what i wanted. That said - it works for now, which is all i really care about atm. 



## What’s Included


1. **Custom Visualizations**

    A set of web-based visualizations for ActivityWatch **stopwatch** data:

    * Tree view
    * Bar chart view
    * Pie chart view
    * Timeline(Weekly/Daily) view


2. **Stopwatch Control Script**

    A Python script for starting and stopping stopwatch events in ActivityWatch.

    - **Modes:**
        - **Start:**  
            * Reads the current task label from the environment variable `KMVAR_Local_Task_Label`.
            * Stops the most recent stopwatch event if one is running.
            * creates a new stopwatch event with the provided label via the ActivityWatch api.
            * Prints `task started: {task_label}` to the console.
        - **Stop:**  
            * Stops the most recent stopwatch event.
            * Prints `task stopped: {task_label}` to the console.

    - **Usage Workflow:**
        
        I use this python script with [Keyboard Maestro](https://www.keyboardmaestro.com/) to quickly manage the ActivityWatch stopwatch:

        1. Each action (**start** / **stop**) is implemented as a Keyboard Maestro subroutine.
        2. A hotkey opens a Keyboard Maestro palette.
            * The palette activates additional hotkeys for specific top-level tasks (e.g., `item setup`, `other`).
            * For tasks requiring manual input (e.g., `other`), Keyboard Maestro prompts me for details.
            * The child action combines the top-level task (e.g., `other`) with the input using the format:
                * `other > [your input]`

        3. Keyboard Maestro sets the task label to the environment variable `KMVAR_Local_Task_Label`
            * this is just how keyboard maestro works, not a deliberate decision on my part
        4. Keyboard Maestro calls the Python script
        5. The script loads the environment variable.
        6. The script submits the event to ActivityWatch.
        7. The script prints `task {action}: {task_label}`
        8. Keyboard Maestro reads the stdout from the script and displays a notification. 



---



<table>
  <tr>
    <td align="center" style="padding: 0;">
        <img alt="Stopwatch Tree" title="Stopwatch Tree" src="https://raw.githubusercontent.com/Marc-Anderson/activitywatch-custom/refs/heads/main/src/visualizations/aw-stopwatch-tree/aw-stopwatch-tree.png" width="250">
        <br><b>Stopwatch Tree</b>
    </td>
    <td align="center" style="padding: 0;">
        <img alt="Stopwatch Timeline" title="Stopwatch Timeline" src="https://raw.githubusercontent.com/Marc-Anderson/activitywatch-custom/refs/heads/main/src/visualizations/aw-stopwatch-timeline/aw-stopwatch-timeline.png" width="250">
        <br><b>Stopwatch Timeline</b>
    </td>
  </tr>
  <tr>
    <td align="center" style="padding: 0;">
        <img alt="Stopwatch Pie" title="Stopwatch Pie" src="https://raw.githubusercontent.com/Marc-Anderson/activitywatch-custom/refs/heads/main/src/visualizations/aw-stopwatch-pie/aw-stopwatch-pie.png" width="250">
        <br><b>Stopwatch Pie</b>
    </td>
    <td align="center" style="padding: 0;">
        <img alt="Stopwatch Bars" title="Stopwatch Bars" src="https://raw.githubusercontent.com/Marc-Anderson/activitywatch-custom/refs/heads/main/src/visualizations/aw-stopwatch-bars/aw-stopwatch-bars.png" width="250">
        <br><b>Stopwatch Bars</b>
    </td>
  </tr>
</table>



---

## Key Details

* **Category Separator**
    Categories are split using `>` (greater-than with spaces on both sides) to group data in the Tree View.

    Examples:
    * `item setup > macys`
    * `item setup > nordstrom`

* **Coloring**
    Colors are generated from stopwatch labels.

    * A given label (e.g., `sometask`) will always have the same color.
    * Drawback: collisions and very similar colors are possible.
    * Also: the palette is... less than ideal.

---

# Visualizations

## How They Work

Visualizations are simple web pages that fetch and transform ActivityWatch data using the following URL parameters:

* **Full URL**

    ```
    http://localhost:5600/pages/{{ visualization_name }}/?hostname={{ name_of_host }}&start={{ utc_timestamp_start }}&end={{ utc_timestamp_end }}&title={{ visualization_title }}
    ```

* **Parameters**

    * visualization_name:
        * `aw-custom-viz`
    * visualization_title:
        * `Custom%20Visualization`
    * name_of_host:
        * `Usernames-MacBook-Pro.local`
    * iso_timestamp_start:
        * `2025-08-26T04%3A00%3A00-04%3A00`
        * `2025-08-26T04:00:00-04:00`
    * iso_timestamp_end:
        * `2025-08-27T08:00:00.000Z`
        * `2025-08-27T08%3A00%3A00.000Z`



---

## Setup & Usage

1. **Create a folder for your custom visualization with an index.html file**

    Example:

    ```
    /Users/username/Library/Application Support/ActivityWatch/aw-custom/{{ visualization_name }}/index.html
    ```

    i prefer creating an `aw-custom` folder in the ActivityWatch config folder as shown above so they're easily accessible since _you can locate this folder via the ActivityWatch menu_


2. **Add a reference to the absolute path in your `aw-server.toml` config to register it**

    Path:

    ```
    /Users/username/Library/Application Support/ActivityWatch/aw-server/aw-server.toml
    ```

    Add an entry under `[server.custom_static]`:

    - the name can be anything, and it doesnt need to be the same as the reference
    - you will use this name in the ActivityWatch ui to reference it
    - this must be the absolute path, relative paths do not work

    ```toml
    [server.custom_static]
    {{ visualization_name }} = "/Users/username/Library/Application Support/ActivityWatch/aw-custom/{{ visualization_name }}"
    ```


3. **Reload ActivityWatch**

    Your new visualization should now be available at `http://localhost:5600/pages/{{ visualization_name }}/`.


4. **Add the visualization to ActivityWatch**

    1. open ActivityWatch
        - `http://localhost:5600`
    2. click `activity` > `edit view` > `add visualization` > `gear icon` > `custom visualization`
    3. enter the name of your visualization
    4. enter the name of your visualization again
    5. click `save`


---

# Build Your Own

## Example

See [aw-watcher-media-player visualization](https://github.com/2e3s/aw-watcher-media-player/blob/main/visualization/index.html) for a working reference.


## Querying Data

You can query data directly in the ActivityWatch ui:

1. Open `ActivityWatch` > `Tools` > `Query`.
2. Run a query for your watcher.
3. Select **Raw JSON**.
4. Click **Query**.


### Example Query: Stopwatch Data (filtered by AFK status)

```sh
afk_events = query_bucket(find_bucket("aw-watcher-afk_"));
window_events = query_bucket(find_bucket("aw-stopwatch"));
window_events = filter_period_intersect(window_events, filter_keyvals(afk_events, "status", ["not-afk"]));
RETURN = sort_by_duration(window_events);
```


---

### Window Data (`aw-watcher-window`)

```json
[
    {
        "data": {
            "app": "Code",
            "title": "processor.py - packerdata"
        },
        "duration": 621.885,
        "id": 63260,
        "timestamp": "2025-08-29T21:52:58.542000+00:00"
    },
    {
        "data": {
            "app": "Microsoft Outlook",
            "title": "Sent • username@company.com"
        },
        "duration": 603.96,
        "id": 63758,
        "timestamp": "2025-08-29T23:34:09.523000+00:00"
    },
    {
        "data": {
            "app": "Microsoft Edge",
            "title": "Website 1 - Microsoft Edge"
        },
        "duration": 456.327,
        "id": 61120,
        "timestamp": "2025-08-29T13:37:42.057000+00:00"
    },
    {
        "data": {
            "app": "Microsoft Edge",
            "title": "Website 1 - Microsoft Edge"
        },
        "duration": 444.579,
        "id": 61118,
        "timestamp": "2025-08-29T13:28:14.106000+00:00"
    },
    {
        "data": {
            "app": "Code",
            "title": "processor.py - packerdata"
        },
        "duration": 405.731,
        "id": 63271,
        "timestamp": "2025-08-29T22:08:09.363000+00:00"
    }
]
```

---

### Stopwatch Data (`aw-stopwatch`)

```json
[
    {
        "data": {
            "label": "other > brand abc",
            "running": false
        },
        "duration": 4432.702523,
        "id": 62165,
        "timestamp": "2025-08-29T18:40:39.155000+00:00"
    },
    {
        "data": {
            "label": "other > admin",
            "running": false
        },
        "duration": 4043,
        "id": 63528,
        "timestamp": "2025-08-29T22:16:21+00:00"
    },
    {
        "data": {
            "label": "responsibility 2 > task 1",
            "running": false
        },
        "duration": 3586.897,
        "id": 61132,
        "timestamp": "2025-08-29T13:53:28.203000+00:00"
    },
    {
        "data": {
            "label": "responsibility 2 > task 1",
            "running": false
        },
        "duration": 3279,
        "id": 61795,
        "timestamp": "2025-08-29T17:39:00+00:00"
    },
    {
        "data": {
            "label": "products > task 4",
            "running": false
        },
        "duration": 2333.726,
        "id": 61473,
        "timestamp": "2025-08-29T15:44:07.274000+00:00"
    }
]
```
