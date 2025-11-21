const userVideo = document.getElementById("user-video");
const startButton = document.getElementById("start-btn");

const state = {
  media: null,
};

startButton.addEventListener("click", () => {
  const mediaRecorder = new MediaRecorder(state.media, {
    audioBitsPerSecond: 128000,
    videoBitsPerSecond: 250000,
    framerate: 25,
  });

  mediaRecorder.ondataavailable = (ev) => {
    console.log(ev.data);
  };

  mediaRecorder.start(25);
});
window.addEventListener("load", async () => {
  const media = await navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });

  userVideo.srcObject = media;
  state.media = media;
});
