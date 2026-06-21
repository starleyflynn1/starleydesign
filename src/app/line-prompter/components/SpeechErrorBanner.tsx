import { getSpeechRecognitionHelp } from '../lib/sttErrors';

interface SpeechErrorBannerProps {
  message: string;
}

export function SpeechErrorBanner({ message }: SpeechErrorBannerProps) {
  const help = getSpeechRecognitionHelp(message);

  if (help) {
    return (
      <div className="banner banner-error" role="alert">
        <p className="banner-error-title">{help.title}</p>
        <ol className="banner-error-steps">
          {help.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div className="banner banner-error" role="alert">
      {message}
    </div>
  );
}
