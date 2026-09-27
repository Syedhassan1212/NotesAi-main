import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportOptions {
  filename?: string;
  format?: 'A4' | 'A3' | 'Letter';
  orientation?: 'portrait' | 'landscape';
  margin?: number;
  includeMetadata?: boolean;
}

export async function exportQuillHtmlToPdf(
  htmlContent: string, 
  filename: string = 'note.pdf',
  options: ExportOptions = {}
): Promise<void> {
  const {
    format = 'A4',
    orientation = 'portrait',
    margin = 20,
    includeMetadata = true
  } = options;

  try {
    console.log('📄 Starting PDF export with images...');
    console.log('📝 Original HTML length:', htmlContent.length);
    
    // Clean HTML content - remove resize handles ONLY
    let cleanedContent = htmlContent;
    const tempClean = document.createElement('div');
    tempClean.innerHTML = htmlContent;
    
    // Count images before cleaning
    const imagesBefore = tempClean.querySelectorAll('img').length;
    console.log(`🖼️ Images found before cleaning: ${imagesBefore}`);
    
    // Remove only the resize handles, NOT images
    tempClean.querySelectorAll('.temp-resize-handle, .resize-handle').forEach(el => {
      console.log('🗑️ Removing resize handle');
      el.remove();
    });
    
    // Remove inline outline styles from images but keep the images
    tempClean.querySelectorAll('img').forEach((img: HTMLImageElement) => {
      img.style.outline = 'none';
      console.log('🖼️ Keeping image:', img.src.substring(0, 50) + '...');
    });
    
    cleanedContent = tempClean.innerHTML;
    const imagesAfter = tempClean.querySelectorAll('img').length;
    console.log(`🖼️ Images after cleaning: ${imagesAfter}`);
    console.log('✅ Cleaned HTML length:', cleanedContent.length);
    
    // Create a temporary container for the HTML content
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '0';
    tempContainer.style.width = '800px'; // Fixed width for consistent rendering
    tempContainer.style.padding = '20px';
    tempContainer.style.backgroundColor = 'white';
    tempContainer.style.fontFamily = 'Arial, sans-serif';
    tempContainer.style.fontSize = '14px';
    tempContainer.style.lineHeight = '1.6';
    tempContainer.innerHTML = cleanedContent;

    // Add to DOM temporarily
    document.body.appendChild(tempContainer);

    const imageCount = tempContainer.querySelectorAll('img').length;
    console.log(`Found ${imageCount} images in content`);

    // Convert all images to base64 to avoid CORS issues
    console.log('Converting images to base64...');
    await convertImagesToBase64(tempContainer);
    console.log('Images converted to base64');

    // Wait for images to load
    console.log('Waiting for images to load...');
    await waitForImages(tempContainer);
    console.log('Images loaded');

    // Convert HTML to canvas with better image handling
    let canvas;
    try {
      console.log('Rendering HTML to canvas...');
      canvas = await html2canvas(tempContainer, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher resolution
        useCORS: false, // Disable CORS for base64/same-origin images
        allowTaint: true, // Allow cross-origin images
        width: 800,
        height: tempContainer.scrollHeight,
        logging: false, // Disable logging for cleaner output
        imageTimeout: 0, // No timeout since we've already converted images
        removeContainer: false, // Don't remove container automatically
        onclone: (clonedDoc) => {
          // Ensure all images in the cloned document are properly loaded
          const imgs = clonedDoc.querySelectorAll('img');
          imgs.forEach((img: HTMLImageElement) => {
            // Force image to display even if still loading
            img.style.display = 'block';
            img.style.maxWidth = '100%';
            img.style.height = 'auto';
          });
        }
      });
      console.log('Canvas rendered successfully:', canvas.width, 'x', canvas.height);
    } catch (canvasError) {
      // Remove temporary container before throwing
      document.body.removeChild(tempContainer);
      console.error('html2canvas error:', canvasError);
      throw new Error(`Failed to convert content to image: ${canvasError instanceof Error ? canvasError.message : 'Unknown error'}`);
    }

    // Remove temporary container
    document.body.removeChild(tempContainer);

    // Create PDF
    console.log('Creating PDF document...');
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - (margin * 2);
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    console.log('PDF dimensions:', pdfWidth, 'x', pdfHeight, 'mm');
    console.log('Image dimensions:', imgWidth, 'x', imgHeight, 'mm');

    // Add metadata if requested
    if (includeMetadata) {
      pdf.setProperties({
        title: filename.replace('.pdf', ''),
        creator: 'Notes App'
      });
    }

    // Add content to PDF
    try {
      if (imgHeight <= pdfHeight - (margin * 2)) {
        // Content fits on one page
        console.log('Adding content as single page');
        const imageData = canvas.toDataURL('image/png');
        pdf.addImage(imageData, 'PNG', margin, margin, imgWidth, imgHeight);
      } else {
        // Content spans multiple pages
        console.log('Adding content across multiple pages');
        let yPosition = margin;
        const pageHeight = pdfHeight - (margin * 2);
        let remainingHeight = imgHeight;
        let pageNum = 1;

        while (remainingHeight > 0) {
          if (yPosition > margin) {
            pdf.addPage();
            yPosition = margin;
            pageNum++;
          }

          console.log(`Adding page ${pageNum}`);
          const currentPageHeight = Math.min(remainingHeight, pageHeight);
          const sourceY = imgHeight - remainingHeight;
          const sourceHeight = (currentPageHeight * canvas.height) / imgHeight;

          // Create a temporary canvas for this page slice
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = sourceHeight;
          const pageCtx = pageCanvas.getContext('2d');
          
          if (pageCtx) {
            pageCtx.drawImage(
              canvas,
              0, sourceY,
              canvas.width, sourceHeight,
              0, 0,
              canvas.width, sourceHeight
            );
            const pageImageData = pageCanvas.toDataURL('image/png');
            pdf.addImage(pageImageData, 'PNG', margin, yPosition, imgWidth, currentPageHeight);
          }
          
          yPosition += currentPageHeight;
          remainingHeight -= currentPageHeight;
        }
      }

      // Save the PDF
      console.log('Saving PDF file:', filename);
      pdf.save(filename);
      console.log('PDF export completed successfully');
    } catch (pdfError) {
      console.error('Error adding images to PDF:', pdfError);
      throw new Error(`Failed to create PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown error'}`);
    }
    
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    console.error('Full error details:', error);
    
    // Try fallback method: Use text-based PDF with images
    console.log('🔄 Attempting fallback export method...');
    try {
      // Clean HTML content first - remove ONLY resize handles
      const tempClean = document.createElement('div');
      tempClean.innerHTML = htmlContent;
      
      console.log(`🖼️ Fallback: Found ${tempClean.querySelectorAll('img').length} images`);
      
      // Remove only resize handles
      tempClean.querySelectorAll('.temp-resize-handle, .resize-handle').forEach(el => el.remove());
      
      // Remove inline outline styles from images but keep images
      tempClean.querySelectorAll('img').forEach((img: Element) => {
        (img as HTMLImageElement).style.outline = 'none';
      });
      const cleanedHTML = tempClean.innerHTML;
      
      console.log(`🖼️ Fallback: After cleaning, ${tempClean.querySelectorAll('img').length} images remain`);
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = cleanedHTML;
      
      // Temporarily add to DOM to get computed styles
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.visibility = 'hidden';
      tempDiv.style.width = '800px';
      document.body.appendChild(tempDiv);
      
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const contentWidth = pdfWidth - (margin * 2);
      let yPos = margin;
      
      // Helper to get computed styles with better Quill support
      const getTextStyles = (element: HTMLElement) => {
        const computedStyle = window.getComputedStyle(element);
        const styles: any = {
          fontSize: 12,
          fontStyle: 'normal',
          fontWeight: 'normal',
          color: [0, 0, 0],
          backgroundColor: null
        };
        
        // Font size - check both computed style and inline style
        let fontSize = parseInt(computedStyle.fontSize) || 12;
        const inlineFontSize = element.style.fontSize;
        if (inlineFontSize) {
          fontSize = parseInt(inlineFontSize) || fontSize;
        }
        styles.fontSize = Math.max(8, Math.min(fontSize * 0.75, 20));
        
        // Font style
        if (computedStyle.fontStyle === 'italic' || element.style.fontStyle === 'italic') {
          styles.fontStyle = 'italic';
        }
        
        // Font weight - check computed, inline, and tag names
        const isStrongOrBold = element.nodeName === 'STRONG' || element.nodeName === 'B';
        if (isStrongOrBold || computedStyle.fontWeight === 'bold' || parseInt(computedStyle.fontWeight) >= 600) {
          styles.fontWeight = 'bold';
        }
        
        // Text color - prioritize inline style
        const inlineColor = element.style.color;
        if (inlineColor && inlineColor.startsWith('rgb')) {
          const rgb = inlineColor.match(/\d+/g);
          if (rgb) styles.color = [parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2])];
        } else {
          const color = computedStyle.color;
          if (color && color.startsWith('rgb')) {
            const rgb = color.match(/\d+/g);
            if (rgb) styles.color = [parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2])];
          }
        }
        
        // Background color - prioritize inline style
        const inlineBg = element.style.backgroundColor;
        if (inlineBg && inlineBg.startsWith('rgb') && inlineBg !== 'rgba(0, 0, 0, 0)') {
          const rgb = inlineBg.match(/\d+/g);
          if (rgb) styles.backgroundColor = [parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2])];
        } else {
          const bgColor = computedStyle.backgroundColor;
          if (bgColor && bgColor.startsWith('rgb') && bgColor !== 'rgba(0, 0, 0, 0)') {
            const rgb = bgColor.match(/\d+/g);
            if (rgb && !(rgb[0] === '255' && rgb[1] === '255' && rgb[2] === '255')) {
              styles.backgroundColor = [parseInt(rgb[0]), parseInt(rgb[1]), parseInt(rgb[2])];
            }
          }
        }
        
        return styles;
      };
      
      // Process all elements (text and images)
      const processNode = (node: Node, parentElement?: HTMLElement) => {
        if (node.nodeType === Node.TEXT_NODE) {
          const text = node.textContent?.trim();
          if (text && parentElement) {
            const styles = getTextStyles(parentElement);
            
            // Apply font
            const fontStyle = styles.fontWeight === 'bold' && styles.fontStyle === 'italic' ? 'bolditalic' :
                            styles.fontWeight === 'bold' ? 'bold' :
                            styles.fontStyle === 'italic' ? 'italic' : 'normal';
            pdf.setFont('helvetica', fontStyle);
            pdf.setFontSize(styles.fontSize);
            pdf.setTextColor(styles.color[0], styles.color[1], styles.color[2]);
            
            const lines = pdf.splitTextToSize(text, contentWidth);
            lines.forEach((line: string) => {
              if (yPos > pdfHeight - margin) {
                pdf.addPage();
                yPos = margin;
              }
              
              // Draw background if exists
              if (styles.backgroundColor) {
                const textWidth = pdf.getTextWidth(line);
                pdf.setFillColor(styles.backgroundColor[0], styles.backgroundColor[1], styles.backgroundColor[2]);
                pdf.rect(margin - 1, yPos - styles.fontSize * 0.8, textWidth + 2, styles.fontSize * 1.2, 'F');
              }
              
              pdf.text(line, margin, yPos);
              yPos += styles.fontSize * 0.5 + 3;
            });
          }
        } else if (node.nodeName === 'IMG') {
          const img = node as HTMLImageElement;
          try {
            const maxImgWidth = contentWidth;
            const aspectRatio = (img.naturalHeight || img.height) / (img.naturalWidth || img.width || 1);
            let imgWidth = img.width || img.naturalWidth || maxImgWidth;
            
            // Scale down if too wide
            if (imgWidth > maxImgWidth) {
              imgWidth = maxImgWidth;
            }
            
            const imgHeight = imgWidth * aspectRatio;
            
            if (yPos + imgHeight > pdfHeight - margin) {
              pdf.addPage();
              yPos = margin;
            }
            
            pdf.addImage(img.src, 'PNG', margin, yPos, imgWidth, imgHeight);
            yPos += imgHeight + 5;
          } catch (imgError) {
            console.warn('Failed to add image:', imgError);
          }
        } else if (node.nodeName === 'BR') {
          yPos += 6;
        } else if (node.nodeName === 'H1') {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(20);
          pdf.setTextColor(0, 0, 0);
          const text = (node as HTMLElement).textContent?.trim();
          if (text) {
            if (yPos > pdfHeight - margin) {
              pdf.addPage();
              yPos = margin;
            }
            pdf.text(text, margin, yPos);
            yPos += 15;
          }
        } else if (node.nodeName === 'H2') {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(16);
          pdf.setTextColor(0, 0, 0);
          const text = (node as HTMLElement).textContent?.trim();
          if (text) {
            if (yPos > pdfHeight - margin) {
              pdf.addPage();
              yPos = margin;
            }
            pdf.text(text, margin, yPos);
            yPos += 12;
          }
        } else if (node.nodeName === 'H3') {
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(14);
          pdf.setTextColor(0, 0, 0);
          const text = (node as HTMLElement).textContent?.trim();
          if (text) {
            if (yPos > pdfHeight - margin) {
              pdf.addPage();
              yPos = margin;
            }
            pdf.text(text, margin, yPos);
            yPos += 10;
          }
        } else if (node.nodeName === 'P' || node.nodeName === 'DIV' || node.nodeName === 'SPAN') {
          Array.from(node.childNodes).forEach(child => processNode(child, node as HTMLElement));
          if (node.nodeName === 'P') yPos += 3; // Add spacing after paragraphs
        } else if (node.nodeName === 'STRONG' || node.nodeName === 'B' || 
                   node.nodeName === 'EM' || node.nodeName === 'I' ||
                   node.nodeName === 'U') {
          Array.from(node.childNodes).forEach(child => processNode(child, node as HTMLElement));
        } else if (node.childNodes) {
          Array.from(node.childNodes).forEach(child => processNode(child, parentElement));
        }
      };
      
      Array.from(tempDiv.childNodes).forEach(node => processNode(node));
      
      // Remove from DOM
      document.body.removeChild(tempDiv);
      
      pdf.save(filename);
      console.log('PDF exported successfully using fallback method');
      return;
    } catch (fallbackError) {
      console.error('Fallback export also failed:', fallbackError);
    }
    
    if (error instanceof Error) {
      throw new Error(`Failed to export PDF: ${error.message}`);
    }
    throw new Error('Failed to export PDF. Please try again.');
  }
}

// Helper function to convert images to base64
async function convertImagesToBase64(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  
  console.log(`Converting ${images.length} images to base64...`);
  
  for (const img of images) {
    // Skip if already base64
    if (img.src.startsWith('data:')) {
      console.log('Image already base64, skipping');
      continue;
    }

    try {
      await new Promise<void>((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        
        const processImage = () => {
          try {
            const width = img.naturalWidth || img.width || 100;
            const height = img.naturalHeight || img.height || 100;
            
            if (width === 0 || height === 0) {
              console.warn('Image has zero dimensions:', img.src);
              resolve();
              return;
            }
            
            canvas.width = width;
            canvas.height = height;
            
            if (ctx) {
              // Draw with white background
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
              
              try {
                const base64 = canvas.toDataURL('image/png');
                img.src = base64;
                console.log(`Converted image ${width}x${height}`);
                resolve();
              } catch (tarintError) {
                console.warn('Tainted canvas, trying JPEG:', tarintError);
                // Try JPEG as fallback
                try {
                  const base64 = canvas.toDataURL('image/jpeg', 0.9);
                  img.src = base64;
                  resolve();
                } catch (jpegError) {
                  console.error('Failed to convert image:', jpegError);
                  // Keep original src
                  resolve();
                }
              }
            } else {
              console.warn('Failed to get canvas context');
              resolve();
            }
          } catch (error) {
            console.error('Error in processImage:', error);
            resolve();
          }
        };

        if (img.complete && (img.naturalWidth > 0 || img.width > 0)) {
          processImage();
        } else {
          const timeout = setTimeout(() => {
            console.warn('Image load timeout:', img.src);
            resolve();
          }, 3000);
          
          img.onload = () => {
            clearTimeout(timeout);
            processImage();
          };
          
          img.onerror = (err) => {
            clearTimeout(timeout);
            console.warn('Image failed to load:', img.src, err);
            resolve();
          };
        }
      });
    } catch (error) {
      console.error('Error converting image:', error);
      // Continue with next image
    }
  }
  
  console.log('All images processed');
}

// Helper function to wait for images to load
function waitForImages(container: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    const images = container.querySelectorAll('img');
    if (images.length === 0) {
      resolve();
      return;
    }

    let loadedCount = 0;
    const totalImages = images.length;

    const checkComplete = () => {
      loadedCount++;
      if (loadedCount === totalImages) {
        resolve();
      }
    };

    images.forEach((img) => {
      if (img.complete && img.naturalWidth > 0) {
        checkComplete();
      } else {
        img.onload = checkComplete;
        img.onerror = checkComplete;
      }
    });

    // Timeout after 10 seconds
    setTimeout(() => {
      resolve();
    }, 10000);
  });
}

export async function exportNoteToPdf(
  title: string,
  content: string,
  tags: string[] = [],
  filename?: string,
  options: ExportOptions = {}
): Promise<void> {
  const {
    format = 'A4',
    orientation = 'portrait',
    margin = 20,
    includeMetadata = true
  } = options;

  try {
    // Check if content has images - if so, use html2canvas approach
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const hasImages = tempDiv.querySelectorAll('img').length > 0;
    
    if (hasImages) {
      // Use the enhanced html2canvas approach for content with images
      await exportQuillHtmlToPdf(content, filename || `${title || 'note'}.pdf`, options);
      return;
    }

    // Use text-based approach for content without images
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pdfWidth - (margin * 2);

    // Add metadata if requested
    if (includeMetadata) {
      pdf.setProperties({
        title: title || 'Untitled Note',
        creator: 'Notes App',
      });
    }

    let yPosition = margin;

    // Add title
    if (title) {
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, margin, yPosition);
      yPosition += 10;
    }

    // Add tags if any
    if (tags.length > 0) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const tagsText = `Tags: ${tags.join(', ')}`;
      pdf.text(tagsText, margin, yPosition);
      yPosition += 8;
    }

    // Add separator line
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pdfWidth - margin, yPosition);
    yPosition += 10;

    // Convert HTML content to plain text for better PDF formatting
    const plainText = tempDiv.textContent || tempDiv.innerText || content;

    // Split content into lines that fit the page width
    const lines = pdf.splitTextToSize(plainText, contentWidth);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');

    for (const line of lines) {
      if (yPosition > pdfHeight - margin - 10) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(line, margin, yPosition);
      yPosition += 6;
    }

    // Save the PDF
    const finalFilename = filename || `${title || 'note'}.pdf`;
    pdf.save(finalFilename);
    
  } catch (error) {
    console.error('Error exporting note to PDF:', error);
    throw new Error('Failed to export PDF. Please try again.');
  }
}

// Utility function to download file to desktop
export function downloadToDesktop(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Enhanced export function that saves to desktop
export async function exportNoteToDesktop(
  title: string,
  content: string,
  tags: string[] = [],
  filename?: string,
  options: ExportOptions = {}
): Promise<void> {
  const {
    format = 'A4',
    orientation = 'portrait',
    margin = 20,
    includeMetadata = true
  } = options;

  try {
    // Check if content has images - if so, use html2canvas approach
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const hasImages = tempDiv.querySelectorAll('img').length > 0;
    
    if (hasImages) {
      // Use the enhanced html2canvas approach for content with images
      await exportQuillHtmlToPdf(content, filename || `${title || 'note'}.pdf`, options);
      return;
    }

    // Use text-based approach for content without images
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const contentWidth = pdfWidth - (margin * 2);

    // Add metadata if requested
    if (includeMetadata) {
      pdf.setProperties({
        title: title || 'Untitled Note',
        creator: 'Notes App',
      });
    }

    let yPosition = margin;

    // Add title
    if (title) {
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(title, margin, yPosition);
      yPosition += 10;
    }

    // Add tags if any
    if (tags.length > 0) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const tagsText = `Tags: ${tags.join(', ')}`;
      pdf.text(tagsText, margin, yPosition);
      yPosition += 8;
    }

    // Add separator line
    pdf.setLineWidth(0.5);
    pdf.line(margin, yPosition, pdfWidth - margin, yPosition);
    yPosition += 10;

    // Convert HTML content to plain text
    const plainText = tempDiv.textContent || tempDiv.innerText || content;

    // Split content into lines
    const lines = pdf.splitTextToSize(plainText, contentWidth);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');

    for (const line of lines) {
      if (yPosition > pdfHeight - margin - 10) {
        pdf.addPage();
        yPosition = margin;
      }
      pdf.text(line, margin, yPosition);
      yPosition += 6;
    }

    // Create blob and download to desktop
    const pdfBlob = pdf.output('blob');
    const finalFilename = filename || `${title || 'note'}.pdf`;
    downloadToDesktop(pdfBlob, finalFilename);
    
  } catch (error) {
    console.error('Error exporting note to desktop:', error);
    throw new Error('Failed to export PDF to desktop. Please try again.');
  }
}
