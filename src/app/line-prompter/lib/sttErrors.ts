export interface SpeechRecognitionHelp {
  title: string;
  steps: string[];
}

export function getSpeechRecognitionHelp(
  error: string
): SpeechRecognitionHelp | null {
  switch (error) {
    case 'service-not-allowed':
      return {
        title: 'Speech recognition is blocked in this browser.',
        steps: [
          'Click the lock icon in the address bar, open Site settings, set Microphone to Allow, then reload and press Start Rehearsal again.',
          'Open the site with https:// (not http://). Chrome requires a secure connection for the microphone and speech recognition.',
          'Press Start Rehearsal before you speak — recognition must start from a click.',
          'On school or work Chromebooks, IT may block speech recognition. Try a personal device if you can.',
          'Disable privacy extensions, or try Incognito with extensions turned off.',
          'Open the prompter in its own tab, not inside another website’s frame.',
        ],
      };
    case 'not-allowed':
      return {
        title: 'Microphone access was denied.',
        steps: [
          'Click the lock icon in the address bar and set Microphone to Allow.',
          'In Chrome, go to Settings → Privacy and security → Site settings → Microphone and allow this site.',
          'Reload the page, then press Start Rehearsal again.',
        ],
      };
    case 'audio-capture':
      return {
        title: 'Chrome could not access your microphone.',
        steps: [
          'Check that a microphone is connected and not muted.',
          'Close other apps that may be using the mic (Zoom, Teams, etc.).',
          'Reload the page and press Start Rehearsal again.',
        ],
      };
    case 'network':
      return {
        title: 'Speech recognition could not reach Google’s servers.',
        steps: [
          'Check your internet connection and try again.',
          'If you are on a restricted network (school, work, VPN), try another connection.',
        ],
      };
    default:
      return null;
  }
}
