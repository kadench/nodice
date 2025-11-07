//NoDice Entrance by Kaden Hansen
//License: All Rights Reserved ©

//Paperback by Bensound.com
//License code: WDELTECG6IBXAHH1
//Artist: : Diffie Bosman


window.addEventListener("DOMContentLoaded", () => {
  const entrance = new Audio("assets/nodice_entrance.mp3");
  const paperback = new Audio("assets/paperback.mp3");

  const enableAudio = () => {
    // Play first sound
    entrance.play().catch(err => console.warn("Audio play failed:", err));

    // When the first finishes, play the next one
    entrance.addEventListener("ended", () => {
      paperback.play().catch(err => console.warn("Second audio play failed:", err));
    });

    // Remove the gesture listeners after first trigger
    window.removeEventListener("click", enableAudio);
    window.removeEventListener("keydown", enableAudio);
  };

  // Wait for any user gesture to start playback
  window.addEventListener("click", enableAudio);
  window.addEventListener("keydown", enableAudio);
});