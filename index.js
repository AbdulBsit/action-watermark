var ffmpeg = require("fluent-ffmpeg");
const pkg = require("./package.json");
const fetch = require("node-fetch");
const nfp = require("node-fetch-progress");
const fs = require("fs");
const path = require("path");

const getBinary = (job, settings) => {
  return new Promise((resolve, reject) => {
    const version = "b4.2.2";
    const filename = `ffmpeg-${version}${
      process.platform == "win32" ? ".exe" : ""
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
            `${Math.floor(p.progress * 100)}% - ${p.doneh}/${p.totalh} - ${
              p.rateh
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
module.exports = async (job, settings, { input, watermark, output }) => {
  let input = options.input || job.output;
  let output = options.output || "watermarked.mp4";
  if (!path.isAbsolute(input)) input = path.join(job.workpath, input);
  if (!path.isAbsolute(output)) output = path.join(job.workpath, output);

  settings.logger.log(`[${job.uid}] starting action-watermark on [${input}] `);

  const path = await getBinary(job, settings);
  ffmpeg.setFfmpegPath(path);

  ffmpeg()
    .input(input)
    .input(watermark)
    .videoCodec("libx264")
    .outputOptions("-pix_fmt yuv420p")
    .complexFilter(["overlay=(main_w-overlay_w)/2:(main_h-overlay_h)/2"])
    .on("error", function (err) {
      settings.logger.log("add watermark fail: " + err.message);
    })
    .on("progress", function (value) {
      settings.logger.log(`In Progress..${value}%`);
    })
    .on("end", function () {
      settings.logger.log("added watermark successfully");
      job.output = output;
      resolve(job);
    })
    .save(output);
};
