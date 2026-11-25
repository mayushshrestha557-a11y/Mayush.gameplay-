export function startStory(onStart) {
  const intro = document.createElement("div");

  intro.id = "mayush-intro";

  intro.innerHTML = `
    <div class="intro-content">

      <p class="intro-label">A NEPALI OPEN WORLD STORY</p>

      <h1>NAYABASTI</h1>
      <p class="intro-subtitle">एउटा गाउँ, एउटा सपना, एउटा यात्रा...</p>

      <div class="elder">
        <div class="elder-icon">👴</div>
        <p id="story-text"></p>
      </div>

      <div class="mayush-photo">
        <img src="./IMG_2348.JPG" alt="Mayush">
        <h2>MAYUSH</h2>
      </div>

      <button id="start-adventure">START GAME</button>

    </div>
  `;

  Object.assign(intro.style, {
    position: "fixed",
    inset: "0",
    zIndex: "100",
    background: "linear-gradient(#172d28,#080e0c)",
    color: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    fontFamily: "Arial"
  });

  document.body.appendChild(intro);

  const text = intro.querySelector("#story-text");

  const dialogue =
    "यो हो हाम्रो नयाबस्ती गाउँ... यही गाउँमा हुर्किएको एउटा केटो हो Mayush। उसको पनि आफ्नै सपना छ, आफ्नै कथा छ। आज ऊ कहाँ पुग्छ, के गर्छ... त्यो समयले बताउनेछ।";

  let i = 0;

  const typing = setInterval(() => {
    text.textContent += dialogue[i];
    i++;

    if (i >= dialogue.length) {
      clearInterval(typing);
    }
  }, 65);

  intro.querySelector("#start-adventure").onclick = () => {
    clearInterval(typing);
    intro.remove();
    onStart?.();
  };
}
