const addWatermark = require("../index")
//workpath (folder destination)
const workpath = "sandbox/"
const output = "output.mp4"; //output name/destination
const input = "" //input name/destination
const watermark = 'https://www.pngkey.com/png/full/187-1877900_bandicam-watermark-png.png' //watermark url or path to file
let started = Date.now()
addWatermark(
    {
        output: "",
        workpath
    },
    {
        logger: { log: console.log },
        workpath
    }, {
    input, watermark, output,
    onStart: () => {
        started = Date.now()
    },
    onComplete: () => console.log("completed in", (Date.now() - started) / 1000, " secs")
})