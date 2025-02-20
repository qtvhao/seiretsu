import { align } from "./align.js";

align('./examples/audio.mp3', './examples/transcript.txt').then(({segments})=> {
    console.log(segments[0].words[0].probability)
})
