import { align } from "./align.js";

align('./examples/audio.mp3', './examples/transcript.txt').then(a=> {
    console.log(a)
})
