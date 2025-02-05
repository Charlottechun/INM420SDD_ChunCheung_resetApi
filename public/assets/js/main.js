document.addEventListener("DOMContentLoaded", () => {
   const apiKey = "9d8de7eb-6cac-409a-95dc-cb5a4af4ac29";
   const searchForm = document.getElementById("searchForm");
   const searchInput = document.getElementById("searchInput");
   const resultContainer = document.getElementById("resultContainer");

// Default search for "Tech" on page load
   fetchDefinition("Tech", apiKey);

   searchForm.addEventListener("submit", async (event) => {
       event.preventDefault();
       const word = searchInput.value.trim();
       if (word) {
           fetchDefinition(word, apiKey);
       }
   });

// Function to fetch word definition from the Merriam-Webster API
   async function fetchDefinition(word, apiKey) {
       const url = `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${apiKey}`;

       try {
           const response = await fetch(url);
           const data = await response.json();
           resultContainer.innerHTML = "";

           if (Array.isArray(data) && typeof data[0] === "string") {
               displaySuggestions(data);
           } else if (data.length > 0) {
               displayDefinition(data[0]);
           } else {
               resultContainer.innerHTML = "<p>No results found.</p>";
           }
       } catch (error) {
           console.error("Error fetching data:", error);
           resultContainer.innerHTML = "<p>Failed to retrieve data. Please try again.</p>";
       }
   }

// Function to display the definition, part of speech, and pronunciation
   function displayDefinition(data) {
       const word = (data.hwi?.hw || "").replace(/\*/g, "");
       const partOfSpeech = data.fl || null;
       const phonetic = (data.hwi?.prs?.[0]?.mw || "").replace(/\*/g, "");
       const audio = data.hwi?.prs?.[0]?.sound?.audio || null;
       const audioUrl = audio ? getAudioUrl(audio) : null;

       // Only show the first definition & Example
       let definitionsHtml = "";
       if (data.shortdef?.length) {
           definitionsHtml = `<ul><li>${data.shortdef[0]}</li></ul>`;
       }

       let examplesHtml = "";
       if (data.def) {
           const examples = data.def[0]?.sseq?.map(seq => {
               return seq[0][1]?.dt?.find(d => d[0] === "vis")?.[1]?.[0]?.t || null;
           }).filter(example => example);

           if (examples && examples.length > 0) {
               examplesHtml = "<h3>Example:</h3><ul>" +
                   `<li>${cleanExampleText(examples[0])}</li>` +
                   "</ul>";
           }
       }

       resultContainer.innerHTML = `
      <h2>${word} ${partOfSpeech ? `<span class="pos">${partOfSpeech}</span>` : ""}</h2>
      ${phonetic ? `${phonetic}` : ""}
      ${audioUrl ? `<button class="play" onclick="playAudio('${audioUrl}')" aria-label="Play pronunciation">🔊</button>` : ""}
      ${definitionsHtml || ""}
      ${examplesHtml || ""}
  `;
   }

   function cleanExampleText(example) {
       return example.replace(/{\/?wi}/g, '').replace(/<\/?[^>]+(>|$)/g, '').trim();
   }

// Function to display suggestions when an exact match is not found
   function displaySuggestions(suggestions) {
       resultContainer.innerHTML = `
         <p>No exact match found. Did you mean:</p>
         <ul>
             ${suggestions.map(suggestion => 
                 `<li><a href="#" class="suggestion-link">${suggestion}</a></li>`).join("")}
         </ul>
     `;

       // Add event listeners to each suggestion link
       document.querySelectorAll(".suggestion-link").forEach(link => {
           link.addEventListener("click", (event) => {
               event.preventDefault(); // Prevent default link behavior
               const suggestedWord = event.target.textContent;
               fetchDefinition(suggestedWord, apiKey); // Fetch new word definition
           });
       });
   }

// Function to construct the correct pronunciation audio URL
   function getAudioUrl(audio) {
       let subdirectory;
       if (audio.startsWith("bix")) {
           subdirectory = "bix";
       } else if (audio.startsWith("gg")) {
           subdirectory = "gg";
       } else if (/^[0-9]/.test(audio)) {
           subdirectory = "number";
       } else {
           subdirectory = audio.charAt(0);
       }
       return `https://media.merriam-webster.com/audio/prons/en/us/mp3/${subdirectory}/${audio}.mp3`;
   }

//  Function to play the pronunciation audio
   window.playAudio = (url) => {
       const audio = new Audio(url);
       audio.play();
   };
});