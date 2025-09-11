// API utility functions
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const analyzeResume = async (resumeContent, jobDescription, format) => {
  const response = await fetch(`${API_BASE_URL}/api/analyze-resume`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      resume_content: resumeContent,
      job_description: jobDescription,
      format: format
    })
  });
  return response;
};

export const optimizeContent = async (content, type, context) => {
  const response = await fetch(`${API_BASE_URL}/api/optimize-content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: content,
      type: type,
      context: context
    })
  });
  return response;
};

export const uploadResume = async (formData) => {
  const response = await fetch(`${API_BASE_URL}/api/upload-resume`, {
    method: 'POST',
    body: formData
  });
  return response;
};