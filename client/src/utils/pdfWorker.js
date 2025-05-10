/**
 * PDF Worker Setup
 * 
 * This file sets up the PDF.js worker globally to ensure it's properly loaded 
 * for the react-pdf component to function correctly.
 */

import { pdfjs } from 'react-pdf';

// Set up the PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = require('pdfjs-dist/build/pdf.worker.entry');

// Set worker paths for all instances of PDF.js
const setPdfWorker = () => {
  console.log('Setting up PDF.js worker...');
  
  // Best option: use the direct unpkg URL which is most reliable
  try {
    const workerUrl = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    console.log('PDF.js worker set to unpkg version:', workerUrl);
    return;
  } catch (error) {
    console.error('Failed to set PDF.js worker from unpkg:', error);
  }
  
  // Second option: CDN version
  try {
    const cdnUrl = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
    pdfjs.GlobalWorkerOptions.workerSrc = cdnUrl;
    console.log('PDF.js worker set to CDN version:', cdnUrl);
    return;
  } catch (error) {
    console.error('Failed to set PDF.js worker from CDN:', error);
  }
  
  // Last resort: local version
  try {
    const localUrl = new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url).toString();
    pdfjs.GlobalWorkerOptions.workerSrc = localUrl;
    console.log('PDF.js worker set to local version:', localUrl);
  } catch (error) {
    console.error('Failed to set PDF.js worker from local file:', error);
    console.error('All PDF.js worker setup attempts failed. PDF viewing will not work.');
  }
};

export default setPdfWorker; 