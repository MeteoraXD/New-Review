import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
// Import the worker directly
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.entry';
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress,
  IconButton,
  Paper,
  Slider,
  Tooltip,
  Snackbar,
  Alert,
  Skeleton,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  SaveAlt as SaveAltIcon,
  NavigateBefore,
  NavigateNext
} from '@mui/icons-material';
import BasicPDFViewer from './BasicPDFViewer';

// Configure PDF.js worker to use the worker we imported
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const PDFReader = ({ pdfUrl, bookTitle, onClose }) => {
  return (
    <BasicPDFViewer
      pdfUrl={pdfUrl}
      bookTitle={bookTitle}
      onClose={onClose}
    />
  );
};

export default PDFReader; 