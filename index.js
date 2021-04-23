const ffmpeg = require("fluent-ffmpeg");
const pkg = require("./package.json");
const fetch = require("node-fetch");
const nfp = require("node-fetch-progress");
const fs = require("fs");
const path = require("path");

const getBinary = (job, settings) => {
  return new Promise((resolve, reject) => {
    const version = "b4.2.2";
    const filename = `ffmpeg-${version}${process.platform == "win32" ? ".exe" : ""
      }`;
    const fileurl = `https://github.com/eugeneware/ffmpeg-static/releases/download/${version}/${process.platform}-x64`;
    const output = path.join(settings.workpath, filename);

    if (fs.existsSync(output)) {
      settings.logger.log(
        `> using an existing ffmpeg binary ${version} at: ${output}`
      );
      return resolve(output);
    }

    settings.logger.log(`> ffmpeg binary ${version} is not found`);
    settings.logger.log(
      `> downloading a new ffmpeg binary ${version} to: ${output}`
    );

    const errorHandler = (error) =>
      reject(
        new Error({
          reason: "Unable to download file",
          meta: { fileurl, error },
        })
      );

    fetch(fileurl)
      .then((res) =>
        res.ok
          ? res
          : Promise.reject({
            reason: "Initial error downloading file",
            meta: { fileurl, error: res.error },
          })
      )
      .then((res) => {
        const progress = new nfp(res);

        progress.on("progress", (p) => {
          process.stdout.write(
            `${Math.floor(p.progress * 100)}% - ${p.doneh}/${p.totalh} - ${p.rateh
            } - ${p.etah}                       \r`
          );
        });

        const stream = fs.createWriteStream(output);

        res.body.on("error", errorHandler).pipe(stream);

        stream.on("error", errorHandler).on("finish", () => {
          settings.logger.log(
            `> ffmpeg binary ${version} was successfully downloaded`
          );
          fs.chmodSync(output, 0o755);
          resolve(output);
        });
      });
  });
};

module.exports = function (
  job,
  settings,
  { input, watermark, output, onStart = () => console.log("Started action-watermark..."),
    onComplete = () => console.log("Finished action-watermark..."), position = "center" }
) {
  onStart()
  return new Promise((resolve, reject) => {
    input = input || job.output
    output = output || "watermarked.mp4";
    if (!input) {
      return reject("input missing, Failed to load input video")
    }
    if (!path.isAbsolute(input)) input = path.join(job.workpath, input);
    if (!path.isAbsolute(watermark) && !watermark.startsWith('http')) watermark = path.join(job.workpath, watermark);
    if (!path.isAbsolute(output)) output = path.join(job.workpath, output);

    settings.logger.log(
      `[${job.uid}] starting action-watermark on [${input}] `
    );

    getBinary(job, settings).then((p) => {
      ffmpeg.setFfmpegPath(p);
      ffmpeg()
        .input(input)
        .inputOptions([
          `-filter_complex overlay=${getOverlayByPosition(position || "center")}`,
        ])
        .input(watermark)
        .outputOptions(['-pix_fmt yuv420p', '-max_muxing_queue_size 1024'])
        .on("error", function (err, stdout, stderr) {
          settings.logger.log("add watermark fail: " + err.message);
          settings.logger.log("watermark stderr: " + stderr);
          onComplete()
          reject(err);
        })
        .on("progress", function (value) {
          settings.logger.log(`In Progress..`);
        })
        .on("end", function () {
          settings.logger.log("added watermark successfully");
          onComplete()
          resolve(job);
        })
        .save(output);
    });
  });
};

function getOverlayByPosition(position) {
  switch (position) {
    case "top-left":
      return "(0.05*main_w):(0.05*main_h)";
    case "top-right":
      return "(0.95*main_w-overlay_w):(0.05*main_h)";
    case "bottom-left":
      return "(0.05*main_w):(0.95*main_h-overlay_h)";
    case "bottom-right":
      return "(0.95*main_w-overlay_w):(0.95*main_h-overlay_h)";
    default:
      return "(main_w-overlay_w)/2:(main_h-overlay_h)/2";
  }
}
