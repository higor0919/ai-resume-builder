import { jsPDF } from "jspdf";

export const exportToPDF = (resumeData) => {
  try {
    // Create a new jsPDF instance
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set up styling
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Add title
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("RESUME", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 15;

    // Contact Info
    if (resumeData.contact) {
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(resumeData.contact.name || "", pageWidth / 2, yPosition, { align: "center" });
      yPosition += 8;

      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      let contactInfo = "";
      if (resumeData.contact.email) contactInfo += `${resumeData.contact.email} | `;
      if (resumeData.contact.phone) contactInfo += `${resumeData.contact.phone} | `;
      if (resumeData.contact.location) contactInfo += `${resumeData.contact.location} | `;
      if (resumeData.contact.linkedin) contactInfo += `${resumeData.contact.linkedin}`;
      
      // Remove trailing " | "
      contactInfo = contactInfo.replace(/ \| $/, "");
      
      doc.text(contactInfo, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 15;
    }

    // Professional Summary
    if (resumeData.summary) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("PROFESSIONAL SUMMARY", 20, yPosition);
      yPosition += 8;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      
      // Split text into lines that fit the page width
      const summaryLines = doc.splitTextToSize(resumeData.summary, pageWidth - 40);
      doc.text(summaryLines, 20, yPosition);
      yPosition += summaryLines.length * 6 + 5;
    }

    // Work Experience
    if (resumeData.experience && resumeData.experience.length > 0) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("WORK EXPERIENCE", 20, yPosition);
      yPosition += 8;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");

      resumeData.experience.forEach((exp, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }

        // Company and position
        doc.setFont("helvetica", "bold");
        doc.text(`${exp.position || ""}`, 20, yPosition);
        doc.setFont("helvetica", "normal");
        doc.text(`${exp.company || ""}`, pageWidth - 20, yPosition, { align: "right" });
        yPosition += 6;

        // Dates
        doc.setFontSize(10);
        doc.text(`${exp.startDate || ""} - ${exp.endDate || ""}`, 20, yPosition);
        yPosition += 6;

        // Description
        if (exp.description) {
          doc.setFontSize(11);
          const descLines = doc.splitTextToSize(exp.description, pageWidth - 40);
          doc.text(descLines, 25, yPosition);
          yPosition += descLines.length * 6 + 3;
        }

        yPosition += 5;
      });
    }

    // Education
    if (resumeData.education && resumeData.education.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("EDUCATION", 20, yPosition);
      yPosition += 8;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");

      resumeData.education.forEach((edu, index) => {
        // Check if we need a new page
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.text(`${edu.degree || ""}`, 20, yPosition);
        doc.setFont("helvetica", "normal");
        doc.text(`${edu.institution || ""}`, pageWidth - 20, yPosition, { align: "right" });
        yPosition += 6;

        doc.setFontSize(10);
        doc.text(`${edu.startDate || ""} - ${edu.endDate || ""}`, 20, yPosition);
        yPosition += 10;
      });
    }

    // Skills
    if (resumeData.skills && resumeData.skills.length > 0) {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("SKILLS", 20, yPosition);
      yPosition += 8;

      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      
      const skillsText = resumeData.skills.join(", ");
      const skillsLines = doc.splitTextToSize(skillsText, pageWidth - 40);
      doc.text(skillsLines, 20, yPosition);
      yPosition += skillsLines.length * 6;
    }

    // Save the PDF
    doc.save("resume.pdf");
    
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    // Fallback to simple text export
    let resumeText = "RESUME\n\n";
    
    // Contact Info
    if (resumeData.contact) {
      resumeText += `${resumeData.contact.name}\n`;
      resumeText += `${resumeData.contact.email} | ${resumeData.contact.phone}\n`;
      if (resumeData.contact.location) {
        resumeText += `${resumeData.contact.location}\n`;
      }
      if (resumeData.contact.linkedin) {
        resumeText += `${resumeData.contact.linkedin}\n`;
      }
      resumeText += "\n";
    }
    
    // Summary
    if (resumeData.summary) {
      resumeText += "PROFESSIONAL SUMMARY\n";
      resumeText += `${resumeData.summary}\n\n`;
    }
    
    // Experience
    if (resumeData.experience && resumeData.experience.length > 0) {
      resumeText += "WORK EXPERIENCE\n";
      resumeData.experience.forEach(exp => {
        resumeText += `${exp.position}\n`;
        resumeText += `${exp.company} | ${exp.startDate} - ${exp.endDate}\n`;
        if (exp.description) {
          resumeText += `${exp.description}\n`;
        }
        resumeText += "\n";
      });
    }
    
    // Education
    if (resumeData.education && resumeData.education.length > 0) {
      resumeText += "EDUCATION\n";
      resumeData.education.forEach(edu => {
        resumeText += `${edu.degree}\n`;
        resumeText += `${edu.institution} | ${edu.startDate} - ${edu.endDate}\n\n`;
      });
    }
    
    // Skills
    if (resumeData.skills && resumeData.skills.length > 0) {
      resumeText += "SKILLS\n";
      resumeText += `${resumeData.skills.join(", ")}\n`;
    }
    
    // Create a blob and download
    const blob = new Blob([resumeText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return false;
  }
};