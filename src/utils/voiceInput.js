/**
 * Voice input using Web Speech API (zero dependencies).
 * Supports en-IN and hi-IN locales.
 */

const SpeechRecognition = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null;

export const isVoiceSupported = Boolean(SpeechRecognition);

/**
 * Parse spoken amount from text.
 * Handles: "25000", "25 thousand", "2.5 lakh", "pachees hazaar"
 */
export function parseSpokenAmount(text) {
  if (!text) return null;
  const t = text.toLowerCase().trim();

  // Direct number
  const directNum = t.replace(/[₹,\s]/g, '');
  if (/^\d+(\.\d+)?$/.test(directNum)) return parseFloat(directNum);

  // "X thousand" / "X hazaar" / "X lakh" / "X crore"
  const multipliers = [
    { words: ['crore', 'karod', 'cr'], mult: 10000000 },
    { words: ['lakh', 'lac', 'lakhs'], mult: 100000 },
    { words: ['thousand', 'hazaar', 'hazar', 'k'], mult: 1000 },
    { words: ['hundred', 'sau'], mult: 100 },
  ];

  for (const { words, mult } of multipliers) {
    for (const w of words) {
      const regex = new RegExp(`(\\d+\\.?\\d*)\\s*${w}`, 'i');
      const match = t.match(regex);
      if (match) return parseFloat(match[1]) * mult;
    }
  }

  // Hindi number words
  const hindiNums = {
    'ek': 1, 'do': 2, 'teen': 3, 'char': 4, 'paanch': 5, 'panch': 5,
    'chhe': 6, 'saat': 7, 'aath': 8, 'nau': 9, 'das': 10,
    'bees': 20, 'tees': 30, 'chalis': 40, 'pachas': 50, 'pachees': 25,
  };
  for (const [word, num] of Object.entries(hindiNums)) {
    if (t.includes(word)) {
      for (const { words, mult } of multipliers) {
        for (const w of words) {
          if (t.includes(w)) return num * mult;
        }
      }
      return num;
    }
  }

  return null;
}

/**
 * Parse category hint from spoken text.
 */
export function parseSpokenCategory(text, categories) {
  if (!text || !categories) return null;
  const t = text.toLowerCase();
  for (const cat of categories) {
    const words = cat.name.toLowerCase().split(/[\s\/]+/);
    if (words.some(w => w.length > 2 && t.includes(w))) return cat.id;
  }
  // Hindi category hints
  const hindiMap = {
    'mistri': 'Labour', 'mazdoor': 'Labour', 'labour': 'Labour',
    'cement': 'Cement', 'sariya': 'Steel', 'steel': 'Steel',
    'eent': 'Bricks', 'brick': 'Bricks', 'paint': 'Paint',
    'bijli': 'Electric', 'electric': 'Electric', 'plumber': 'Plumbing',
    'lakdi': 'Wood', 'carpenter': 'Wood', 'tile': 'Tiles',
  };
  for (const [hint, catName] of Object.entries(hindiMap)) {
    if (t.includes(hint)) {
      const match = categories.find(c => c.name.includes(catName));
      if (match) return match.id;
    }
  }
  return null;
}

/**
 * Start voice recognition. Returns a promise with the transcript.
 */
export function startVoiceRecognition(lang = 'en-IN') {
  return new Promise((resolve, reject) => {
    if (!SpeechRecognition) {
      reject(new Error('Speech recognition not supported'));
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    let resolved = false;
    recognition.onresult = (e) => {
      resolved = true;
      const transcript = e.results[0][0].transcript;
      resolve(transcript);
    };
    recognition.onerror = (e) => {
      if (!resolved) reject(new Error(e.error === 'not-allowed' ? 'Microphone access denied. Please allow microphone in browser settings.' : e.error === 'no-speech' ? 'No speech detected. Please try again.' : e.error));
    };
    recognition.onend = () => {
      if (!resolved) reject(new Error('no-speech'));
    };

    try {
      recognition.start();
    } catch (e) {
      reject(new Error('Could not start voice recognition. Try using Chrome or Edge.'));
      return;
    }

    // Auto-stop after 8 seconds
    setTimeout(() => {
      try { recognition.stop(); } catch (e) {}
    }, 8000);
  });
}
