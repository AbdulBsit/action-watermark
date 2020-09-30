const ffmpeg = require("fluent-ffmpeg");

ffmpeg.setFfmpegPath("/Users/harshbhatia/code/sandbox/ffmpeg-b4.2.2");
const input =
  "https://file-examples-com.github.io/uploads/2017/04/file_example_MP4_640_3MG.mp4";
const watermark = "https://www.fnordware.com/superpng/pngtest8rgba.png";
const output = "./output.mp4";

ffmpeg()
  .input(input)
  .input(watermark)
  .videoCodec("libx264")
  .outputOptions("-pix_fmt yuv420p")

  //center
  //   .complexFilter(["overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2"])
  // top left
  //   .complexFilter(["overlay=(0.05*main_w):(0.05*main_h)"])
  // top right
  //   .complexFilter(["overlay=(0.95*main_w-overlay_w):(0.05*main_h)"])
  //   bottom right
  //   .complexFilter(["overlay=(0.95*main_w-overlay_w):(0.95*main_h-overlay_h)"])
  //   bottom left
  .complexFilter(["overlay=(0.05*main_w):(0.95*main_h-overlay_h)"])

  .on("error", function (err) {
    console.log("add watermark fail: " + err.message);
  })
  .on("progress", function (value) {
    console.log(value);
  })
  .on("end", function () {
    console.log("added watermark successfully");
  })
  .save(output);
