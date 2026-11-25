
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
        <img src="./IMG_3248.JPG" alt="Mayush">
        <h2>MAYUSH</h2>
        <p>उसको कथा अब सुरु हुँदैछ...</p>
      </div>

      <button id="start-adventure">START GAME</button>
      <button id="sound-button">🔊 आवाज सुरु गर्नुहोस्</button>
    </div>
  `;

  const style = document.createElement("style");
  style.textContent = `
    #mayush-intro {
      position: fixed;
      inset: 0;
      z-index: 100;
      overflow-y: auto;
      color: white;
      text-align: center;
      font-family: Arial, sans-serif;
      background:
        linear-gradient(180deg, #192c35dd, #15231bdd, #080e0c);
    }

    .cinema-scene {
      min-height: 100%;
      padding: 22px 18px 35px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .cinema-top {
      color: #d9bc82;
      font-size: 10px;
      letter-spacing: 5px;
      margin-bottom: 25px;
    }

    .village-title h1 {
      font-size: 39px;
      letter-spacing: 8px;
      text-shadow: 0 3px 20px #000;
    }

    .village-title p {
      color: #d6cbb6;
      margin: 12px 0 25px;
    }

    .elder-scene {
      width: 100%;
      max-width: 430px;
      display: flex;
      gap: 13px;
      align-items: center;
      padding: 17px;
      background: #ffffff13;
      border: 1px solid #bda16b77;
      border-radius: 15px;
      text-align: left;
    }

    .elder-face {
      font-size: 55px;
    }

    .elder-dialogue {
      flex: 1;
      line-height: 1.8;
    }

    .elder-dialogue span {
      color: #dfbc7a;
      font-size: 12px;
    }

    #story-text {
      font-size: 14px;
      margin-top: 5px;
    }

    .tea-scene {
      margin: 22px 0;
      padding: 17px;
      width: 100%;
      max-width: 430px;
      border-radius: 12px;
      background: #513b2c;
      box-shadow: inset 0 0 20px #0007;
    }

    .tea-scene span {
      font-size: 35px;
      margin: 0 12px;
    }

    .tea-scene p {
      margin-top: 12px;
      color: #ffe0a8;
    }

    .tea-scene small {
      color: #ddd0c1;
    }

    .mayush-scene img {
      width: 115px;
      height: 140px;
      border-radius: 12px;
      object-fit: cover;
      border: 2px solid #c7a66b;
    }

    .mayush-scene h2 {
      letter-spacing: 5px;
      margin-top: 10px;
    }

    .mayush-scene p {
      color: #d8c9ad;
      font-size: 12px;
    }

    #start-adventure,
    #sound-button {
      margin-top: 18px;
      padding: 13px 28px;
      border-radius: 30px;
      border: 1px solid #d5b875;
      background: #a77c3d;
      color: white;
      font-weight: bold;
      font-size: 14px;
    }

    #sound-button {
      margin-top: 10px;
      background: #283b35;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(intro);

  const dialogue =
    "यो हो हाम्रो नयाबस्ती गाउँ... यही गाउँमा हुर्किएको एउटा केटो हो Mayush। उसको पनि आफ्नै सपना छ, आफ्नै कथा छ। आज ऊ कहाँ पुग्छ, के गर्छ... त्यो समयले बताउनेछ।";

  const text = intro.querySelector("#story-text");
  let index = 0;

  const typing = setInterval(() => {
    text.textContent += dialogue[index];
    index++;

    if (index >= dialogue.length) {
      clearInterval(typing);
    }
  }, 65);

  let speaking = false;

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
    speaking = true;
  };

  intro.querySelector("#start-adventure").onclick = () => {
    clearInterval(typing);

    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    intro.remove();
    style.remove();

    onStart?.();
  };
}
