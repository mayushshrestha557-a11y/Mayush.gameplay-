
export function startStory(onStart) {
  const intro = document.createElement("div");
  intro.id = "mayush-intro";

  intro.innerHTML = `
    <div class="cinema-scene">
      <div class="cinema-top">MAYUSH.GAMEPLAY PRESENTS</div>

      <div class="village-title">
        <h1>NAYABASTI</h1>
        <p>एउटा गाउँ, एउटा सपना, एउटा यात्रा...</p>
      </div>

      <div class="elder-scene">
        <div class="elder-face">👴</div>
        <div class="elder-dialogue">
          <span>गाउँका बुढाबा</span>
          <p id="story-text"></p>
        </div>
      </div>

      <div class="tea-scene">
        <span>☕</span>
        <span>☕</span>
        <span>☕</span>
        <p>नयाबस्ती चिया पसल</p>
        <small>गाउँलेहरूको गफगाफ...</small>
      </div>

      <div class="mayush-scene">
        <div class="mayush-avatar">🧑</div>
        <h2>MAYUSH</h2>
        <p>उसको कथा अब सुरु हुँदैछ...</p>
      </div>

      <button id="start-adventure">START GAME</button>
      <button id="sound-button">🔊 आवाज सुरु गर्नुहोस्</button>
    </div>
  `;

  document.body.appendChild(intro);

  const dialogue =
    "यो हो हाम्रो नयाबस्ती गाउँ... यही गाउँमा हुर्किएको एउटा केटो हो Mayush। उसको पनि आफ्नै सपना छ, आफ्नै कथा छ। आज ऊ कहाँ पुग्छ, के गर्छ... त्यो समयले बताउनेछ।";

  const text = intro.querySelector("#story-text");
  let index = 0;

  const typing = setInterval(() => {
    text.textContent += dialogue[index] || "";
    index++;

    if (index >= dialogue.length) {
      clearInterval(typing);
    }
  }, 65);

  intro.querySelector("#sound-button").onclick = () => {
    if (!("speechSynthesis" in window)) {
      text.textContent = dialogue;
      return;
    }

    window.speechSynthesis.cancel();

    const voice = new SpeechSynthesisUtterance(dialogue);
    voice.lang = "ne-NP";
    voice.rate = 0.85;
    voice.pitch = 0.85;

    window.speechSynthesis.speak(voice);
  };

  intro.querySelector("#start-adventure").onclick = () => {
    clearInterval(typing);

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    intro.remove();
    onStart?.();
  };
}
