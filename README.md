# action-watermark for Nexrenderer

Module for adding watermark to encoded video

# Action: Add Watermark

Add watermark to your encoded video,
You don't need to have ffmpeg installed on your system.

## Installation

If you are using [binary](https://github.com/inlife/nexrender/releases) version of the nexrender,
there is no need to install the module, it is **included** in the binary build.

```
npm i action-watermark -g
```

## Usage

When creating your render job provide this module as one of the `postrender` actions:

```json
// job.json
{
  "actions": {
    "postrender": [
      {
        "module": "action-watermark",
        "input": "foobar.mp4",
        "watermark": "http://assets.stickpng.com/images/5cb78678a7c7755bf004c14c.png",
        "output": "WatermarkedFooBar.mp4"
      }
    ]
  }
}
```

## Information

- `output` is a path on your system where result will be saved to, can be either relative or absoulte path.
- `input` path of the video file you want to add video to, can be either relative or abosulte path. Defaults to current job output video file.
- `watermark` is url to a watermark
