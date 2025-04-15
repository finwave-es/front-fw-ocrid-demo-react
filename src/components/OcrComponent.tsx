import React, { useEffect, useRef, useState } from 'react'
import { OcrId, Envs, EventType, EventTypeUserFeedback, Endpoints } from 'fw-ocrid'
import styles from './OcrComponent.module.css'

declare global {
  interface Window {
    regulaLicense?: {
      license: string;
    };
  }
}
const OcrComponent: React.FC = () => {
  const videoRef = useRef<HTMLDivElement | null>(null)
  const [regulaLicense, setRegulaLicense] = useState('');
  const [apiKey, setApiKey] = useState('')
  const [env] = useState(Envs.PRE3)
  const [ocrid, setOcrid] = useState<OcrId | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => {
    if (regulaLicense.trim()) {
      window.regulaLicense = { license: regulaLicense.trim() };
      setStatus('Regula license applied (license property).');
    } else {
      delete window.regulaLicense;
      setStatus('Regula license is only for development and testing purposes in local environtments.');
    }
  }, [regulaLicense]);


  useEffect(() => {
    if (!ocrid || !videoRef.current) return;

    ocrid.events(EventType.USER_FEEDBACK).subscribe((feedback) => {
      switch (feedback) {
        case EventTypeUserFeedback.SHOW_DOCUMENT_FRONT_SIDE:
          console.log('Show the front side of the document.');
          break;
        case EventTypeUserFeedback.SHOW_DOCUMENT_REVERSE_SIDE:
          console.log('Show the reverse side of the document.');
          break;
        case EventTypeUserFeedback.DOCUMENT_FRONT_SIDE_COMPLETED:
          console.log('Front side scanned successfully.');
          break;
        case EventTypeUserFeedback.PROCESS_FAILED_DUE_ANALYSIS_ERROR:
          console.error('Process failed due to an analysis error.');
          break;
        case EventTypeUserFeedback.PROCESS_FINISHED:
          console.log('Scanning process completed.');
          break;
        default:
          console.log('Feedback:', feedback);
      }
    });

    ocrid.events(EventType.RESULT).subscribe(() => {
      setStatus(`Scan completed`);

      if ((ocrid as any).id) {
        fetch(`${Endpoints[env]}/result/${(ocrid as any).id}`)
          .then(response => {
            console.log('Response status:', response.status);
            if (response.ok) {
              const contentType = response.headers.get('content-type');
              if (contentType && contentType.includes('application/json')) {
                return response.json();
              } else {
                return response.text().then(text => {
                  console.log('Raw response:', text);
                  return { rawText: text };
                });
              }
            } else {
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
          })
          .then(data => {
            console.log('Backend response:', data);
          })
          .catch(error => {
            console.error('Error fetching results:', error);
          });
      }

      ocrid.close(); 
    });

    ocrid.events(EventType.ERROR).subscribe((error: ErrorEvent) => {
      setStatus(`An error occurred: ${error}`); 
    });

    return () => {
      ocrid.close();
    };
  }, [ocrid]);

    const startStream = async () => {
      if (!videoRef.current || !apiKey) {
        setStatus('API Key is required and video element must be loaded.');
        return;
      }
    const instance = new OcrId(apiKey, env, undefined, 'en');
    setOcrid(instance);

    try {
      await instance.startStream(videoRef.current);
      setStatus('Camera stream started.');
    } catch (error) {
      setStatus(`Error starting camera stream: ${error}`);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>OCR ID Integration</h2>

      <input
        type="text"
        placeholder="API key (Required)*"
        className={styles.input}
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
      />
      <input
        type="text"
        placeholder="Regula license (Required for local env)*"
        className={styles.input}
        value={regulaLicense}
        onChange={(e) => setRegulaLicense(e.target.value)}
      />
      <button
        className={styles.button}
        onClick={startStream}
        disabled={!apiKey}
      >
        START OCR
      </button>

      <div 
        ref={videoRef} 
        id="video-tag" 
        className={styles.videoContainer}
        />
      <div className={styles.status}>
        {status}
      </div>
    </div>
  );
};


export default OcrComponent;