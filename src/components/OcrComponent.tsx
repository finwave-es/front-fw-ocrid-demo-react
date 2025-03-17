import React, { useEffect, useRef } from 'react';
import { OcrId, Envs, EventType, EventTypeUserFeedback } from 'fw-ocrid';

const OcrComponent: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const ocrid = new OcrId('API_KEY', Envs.PRE3, undefined, 'en');

    // Handle user feedback events
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

    // Handle result events
    ocrid.events(EventType.RESULT).subscribe((result) => {
      console.log('Scan completed:', result);
      ocrid.close(); // Close the process
    });

    // Handle error events
    ocrid.events(EventType.ERROR).subscribe((error: ErrorEvent) => {
      console.error('An error occurred:', error);
    });

    // Start the camera stream
    const startStream = async () => {
      try {
        if (videoRef.current) {
          await ocrid.startStream(videoRef.current);
          console.log('Camera stream started.');
        } else {
          console.error('Video element reference is null.');
        }
      } catch (error) {
        console.error('Error starting camera stream:', error);
      }
    };

    startStream();

    return () => {
      ocrid.close();
    };
  }, []);

  return (
    <div>
      <video ref={videoRef} id="video-tag" autoPlay playsInline style={{ width: '100%', height: 'auto' }} />
    </div>
  );
};

export default OcrComponent;