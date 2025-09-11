import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { FileText, Target, Zap, CheckCircle, AlertCircle, Loader2, Lightbulb, TrendingUp, Save, Eye, EyeOff, ArrowLeftRight, Download } from 'lucide-react'
import StructuredResumeEditor from '@/components/StructuredResumeEditor.jsx'
import { exportToPDF } from '@/utils/pdfExporter.js'
import { analyzeResume, optimizeContent, uploadResume } from '@/utils/api.js'
import './App.css'

// Initial structured resume data
const initialResumeData = {
  contact: {
    name: '',
    email: '',
    phone: '',
    location: '',
    linkedin: ''
  },
  summary: '',
  experience: [],
  education: [],
  skills: []
}

function App() {
  const [resumeContent, setResumeContent] = useState('')
  const [structuredResume, setStructuredResume] = useState(initialResumeData)
  const [jobDescription, setJobDescription] = useState('')
  const [atsScore, setAtsScore] = useState(0)
  const [suggestions, setSuggestions] = useState([])
  const [whatsWrongList, setWhatsWrongList] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [optimizedSuggestions, setOptimizedSuggestions] = useState({})
  const [loadingOptimizations, setLoadingOptimizations] = useState({})
  const [lastSaved, setLastSaved] = useState(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle')
  const [previewMode, setPreviewMode] = useState(true)
  const [showBeforeAfter, setShowBeforeAfter] = useState({})
  const [beforeContent, setBeforeContent] = useState({})
  const [activeTab, setActiveTab] = useState('structured')
  const [isUploading, setIsUploading] = useState(false)
  const [isFormatting, setIsFormatting] = useState(false)

  // Refs for timeouts to prevent re-renders
  const autoSaveTimeoutRef = useRef(null);
  const scoringTimeoutRef = useRef(null);
  const statusResetTimeoutRef = useRef(null);
  
  // Refs to track previous values and prevent infinite loops
  const previousStructuredResumeRef = useRef(structuredResume);
  const previousResumeContentRef = useRef(resumeContent);
  const isUpdatingRef = useRef(false);

  // Function to convert structured resume to freeform text
  const convertStructuredToFreeform = useCallback((structuredData) => {
    let freeformText = '';
    
    // Add contact information
    if (structuredData.contact) {
      if (structuredData.contact.name) freeformText += `${structuredData.contact.name}\n`;
      if (structuredData.contact.email) freeformText += `${structuredData.contact.email} | `;
      if (structuredData.contact.phone) freeformText += `${structuredData.contact.phone} | `;
      if (structuredData.contact.location) freeformText += `${structuredData.contact.location} | `;
      if (structuredData.contact.linkedin) freeformText += `${structuredData.contact.linkedin}`;
      // Remove trailing " | " and add newlines
      freeformText = freeformText.replace(/ \| $/, '').replace(/ \| $/, '') + '\n\n';
    }
    
    // Add professional summary
    if (structuredData.summary) {
      freeformText += `PROFESSIONAL SUMMARY\n${structuredData.summary}\n\n`;
    }
    
    // Add work experience
    if (structuredData.experience && structuredData.experience.length > 0) {
      freeformText += 'WORK EXPERIENCE\n';
      structuredData.experience.forEach(exp => {
        freeformText += `\n${exp.position || ''}\n`;
        freeformText += `${exp.company || ''} | ${exp.startDate || ''} - ${exp.endDate || ''}\n`;
        if (exp.description) freeformText += `${exp.description}\n`;
      });
      freeformText += '\n';
    }
    
    // Add education
    if (structuredData.education && structuredData.education.length > 0) {
      freeformText += 'EDUCATION\n';
      structuredData.education.forEach(edu => {
        freeformText += `\n${edu.degree || ''}\n`;
        freeformText += `${edu.institution || ''} | ${edu.startDate || ''} - ${edu.endDate || ''}\n`;
      });
      freeformText += '\n';
    }
    
    // Add skills
    if (structuredData.skills && structuredData.skills.length > 0) {
      freeformText += 'SKILLS\n';
      freeformText += structuredData.skills.join(', ') + '\n';
    }
    
    return freeformText.trim();
  }, []);

  // Function to convert freeform text to structured resume (basic implementation)
  const convertFreeformToStructured = useCallback((freeformText) => {
    // This is a simplified implementation - in a real app, you'd want more sophisticated parsing
    return {
      ...initialResumeData,
      summary: freeformText
    };
  }, []);

  // Effect to sync structured resume to freeform when structured resume changes
  useEffect(() => {
    // Prevent infinite loop by checking if data actually changed
    const isStructuredChanged = JSON.stringify(structuredResume) !== JSON.stringify(previousStructuredResumeRef.current);
    
    if (isStructuredChanged && activeTab === 'structured' && !isUpdatingRef.current) {
      isUpdatingRef.current = true;
      const freeform = convertStructuredToFreeform(structuredResume);
      // Only update if the freeform content is actually different
      if (freeform !== resumeContent) {
        setResumeContent(freeform);
      }
      // Update the ref to current value
      previousStructuredResumeRef.current = structuredResume;
      // Reset the updating flag after a short delay
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [structuredResume, activeTab, convertStructuredToFreeform, resumeContent]);

  // Effect to sync freeform to structured resume when freeform changes and we're in freeform tab
  useEffect(() => {
    // Prevent infinite loop by checking if data actually changed
    const isFreeformChanged = resumeContent !== previousResumeContentRef.current;
    
    if (isFreeformChanged && activeTab === 'freeform' && !isUpdatingRef.current) {
      isUpdatingRef.current = true;
      // Only convert if we have substantial content and structured resume is mostly empty
      const isStructuredEmpty = !structuredResume.contact?.name && 
                               !structuredResume.summary && 
                               (!structuredResume.experience || structuredResume.experience.length === 0) &&
                               (!structuredResume.education || structuredResume.education.length === 0) &&
                               (!structuredResume.skills || structuredResume.skills.length === 0);
      
      if (resumeContent.trim() && isStructuredEmpty) {
        const structured = convertFreeformToStructured(resumeContent);
        // Only update if the structured content is actually different
        if (JSON.stringify(structured) !== JSON.stringify(structuredResume)) {
          setStructuredResume(structured);
        }
      }
      // Update the ref to current value
      previousResumeContentRef.current = resumeContent;
      // Reset the updating flag after a short delay
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [resumeContent, activeTab, structuredResume, convertFreeformToStructured]);

  const toggleBeforeAfter = (suggestionId) => {
    setShowBeforeAfter(prev => ({
      ...prev,
      [suggestionId]: !prev[suggestionId]
    }));
  };

  // Real-time ATS scoring
  const [realTimeScore, setRealTimeScore] = useState(null);

  const requestRealTimeScoring = useCallback(() => {
    // Clear existing timeout
    if (scoringTimeoutRef.current) {
      clearTimeout(scoringTimeoutRef.current);
    }

    // Set new timeout for 2 seconds after last keystroke
    scoringTimeoutRef.current = setTimeout(() => {
      if (resumeContent && jobDescription) {
        // In a real implementation, this would call the backend
        // For now, we'll simulate with a mock score
        const mockScore = Math.min(100, Math.max(30, 
          50 + 
          (resumeContent.length / 100) + 
          (jobDescription.length / 50) +
          (Math.random() * 10 - 5)
        ));
        setRealTimeScore(Math.round(mockScore));
      }
    }, 2000);
  }, [resumeContent, jobDescription]);

  // Trigger real-time scoring when content changes
  useEffect(() => {
    requestRealTimeScoring();
    return () => {
      if (scoringTimeoutRef.current) {
        clearTimeout(scoringTimeoutRef.current);
      }
    };
  }, [resumeContent, jobDescription]);

  // Auto-save functionality with proper debouncing
  useEffect(() => {
    // Don't save on initial render
    if (resumeContent === '' && jobDescription === '' && JSON.stringify(structuredResume) === JSON.stringify(initialResumeData)) return;
    
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for 5 seconds after last change
    autoSaveTimeoutRef.current = setTimeout(() => {
      setAutoSaveStatus('saving')
      try {
        localStorage.setItem('resumeContent', resumeContent)
        localStorage.setItem('jobDescription', jobDescription)
        localStorage.setItem('structuredResume', JSON.stringify(structuredResume))
        setLastSaved(new Date())
        setAutoSaveStatus('saved')
        
        // Reset status after 2 seconds
        if (statusResetTimeoutRef.current) {
          clearTimeout(statusResetTimeoutRef.current);
        }
        statusResetTimeoutRef.current = setTimeout(() => {
          setAutoSaveStatus('idle')
        }, 2000)
      } catch (error) {
        console.error('Failed to save to localStorage:', error)
        setAutoSaveStatus('idle')
      }
    }, 5000);

    // Cleanup function
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      if (statusResetTimeoutRef.current) {
        clearTimeout(statusResetTimeoutRef.current);
      }
    };
  }, [resumeContent, jobDescription, structuredResume]);

  // Load from localStorage on initial load
  useEffect(() => {
    const savedResume = localStorage.getItem('resumeContent')
    const savedJobDesc = localStorage.getItem('jobDescription')
    const savedStructuredResume = localStorage.getItem('structuredResume')
    
    if (savedResume) setResumeContent(savedResume)
    if (savedJobDesc) setJobDescription(savedJobDesc)
    if (savedStructuredResume) {
      try {
        setStructuredResume(JSON.parse(savedStructuredResume))
      } catch (e) {
        console.error('Failed to parse structured resume from localStorage:', e)
      }
    }
  }, []);

  const handleFormattingFix = async () => {
    if (!resumeContent) return;
    
    setIsFormatting(true);
    
    try {
      const response = await optimizeContent(resumeContent, 'format', {
        job_description: jobDescription,
        // Pass the appropriate resume data based on active tab
        resume_content: activeTab === 'structured' ? JSON.stringify(structuredResume) : resumeContent
      });
      
      if (response.ok) {
        const result = await response.json();
        // For formatting fixes, we want to update the entire resume content
        const formattedContent = result.optimized_content;
        
        // Update both structured and freeform based on which tab is active
        if (activeTab === 'structured') {
          // If we're in structured mode, we should try to parse the formatted content back to structured
          // For now, we'll just update the freeform content
          setResumeContent(formattedContent);
        } else {
          // If we're in freeform mode, just update the freeform content
          setResumeContent(formattedContent);
        }
      } else {
        // Fallback formatting fix
        const formattedContent = applyBasicFormatting(resumeContent);
        setResumeContent(formattedContent);
        
        // Also update structured resume if we're in structured mode
        if (activeTab === 'structured') {
          const structured = convertFreeformToStructured(formattedContent);
          setStructuredResume(structured);
        }
      }
    } catch (error) {
      console.error('Error applying formatting fix:', error);
      // Fallback formatting fix
      const formattedContent = applyBasicFormatting(resumeContent);
      setResumeContent(formattedContent);
      
      // Also update structured resume if we're in structured mode
      if (activeTab === 'structured') {
        const structured = convertFreeformToStructured(formattedContent);
        setStructuredResume(structured);
      }
    } finally {
      setIsFormatting(false);
    }
  }

  const applyBasicFormatting = (content) => {
    // Basic formatting improvements
    return content
      .replace(/\t/g, '  ') // Replace tabs with spaces
      .replace(/\s+$/gm, '') // Remove trailing whitespace
      .replace(/^\s+/gm, '') // Remove leading whitespace
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines to 2
      .trim();
  }

  const analyzeResumeHandler = async () => {
    if (((activeTab === 'structured' && !structuredResume) || 
         (activeTab === 'freeform' && !resumeContent)) || 
        !jobDescription) return
    
    setIsAnalyzing(true)
    
    try {
      const response = await analyzeResume(
        activeTab === 'structured' ? JSON.stringify(structuredResume) : resumeContent,
        jobDescription,
        activeTab
      );
      
      if (response.ok) {
        const result = await response.json()
        setAtsScore(result.ats_score)
        
        // Enhanced suggestions with more detailed structure
        const enhancedSuggestions = result.suggestions.map((suggestion, index) => ({
          id: `suggestion-${index}`,
          type: getSuggestionType(suggestion),
          text: suggestion,
          priority: getSuggestionPriority(suggestion),
          category: getSuggestionCategory(suggestion),
          impact: getSuggestionImpact(suggestion)
        }))
        
        setSuggestions(enhancedSuggestions)
        
        // Set "What's Wrong" list with specific issues
        setWhatsWrongList(result.issues || [])
        
        // Add missing keywords as separate suggestions
        if (result.missing_keywords && result.missing_keywords.length > 0) {
          const keywordSuggestions = result.missing_keywords.map((keyword, index) => ({
            id: `keyword-${index}`,
            type: 'keyword',
            text: `Add "${keyword}" keyword to match job requirements`,
            priority: 'high',
            category: 'Keywords',
            impact: '+5-10 ATS points',
            keyword: keyword
          }))
          setSuggestions(prev => [...prev, ...keywordSuggestions])
        }
      } else {
        // Fallback to demo data if API fails
        setAtsScore(Math.floor(Math.random() * 40) + 60)
        setSuggestions([
          { type: 'missing', text: 'Add "Python" keyword to match job requirements' },
          { type: 'improve', text: 'Quantify your achievements with specific numbers' },
          { type: 'format', text: 'Use bullet points for better ATS parsing' }
        ])
        
        // Demo "What's Wrong" list
        setWhatsWrongList([
          "Missing contact information section",
          "No quantified achievements in work experience",
          "Lack of relevant keywords from job description",
          "Inconsistent date formatting",
          "Missing action verbs in job descriptions"
        ])
      }
    } catch (error) {
      console.error('Error analyzing resume:', error)
      // Fallback to demo data
      setAtsScore(Math.floor(Math.random() * 40) + 60)
      setSuggestions([
        { type: 'missing', text: 'Add "Python" keyword to match job requirements' },
        { type: 'improve', text: 'Quantify your achievements with specific numbers' },
        { type: 'format', text: 'Use bullet points for better ATS parsing' }
      ])
      
      // Demo "What's Wrong" list
      setWhatsWrongList([
        "Missing contact information section",
        "No quantified achievements in work experience",
        "Lack of relevant keywords from job description",
        "Inconsistent date formatting",
        "Missing action verbs in job descriptions"
      ])
    }
    
    setIsAnalyzing(false)
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getScoreBackground = (score) => {
    if (score >= 80) return 'bg-green-100'
    if (score >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const getSuggestionType = (suggestion) => {
    const lowerSuggestion = suggestion.toLowerCase()
    if (lowerSuggestion.includes('keyword') || lowerSuggestion.includes('add')) return 'keyword'
    if (lowerSuggestion.includes('quantify') || lowerSuggestion.includes('number')) return 'quantify'
    if (lowerSuggestion.includes('bullet') || lowerSuggestion.includes('format')) return 'format'
    if (lowerSuggestion.includes('experience') || lowerSuggestion.includes('skill')) return 'experience'
    if (lowerSuggestion.includes('contact') || lowerSuggestion.includes('info')) return 'contact'
    if (lowerSuggestion.includes('action') || lowerSuggestion.includes('verb')) return 'action'
    return 'improve'
  }

  const getSuggestionPriority = (suggestion) => {
    const lowerSuggestion = suggestion.toLowerCase()
    if (lowerSuggestion.includes('critical') || lowerSuggestion.includes('must')) return 'critical'
    if (lowerSuggestion.includes('important') || lowerSuggestion.includes('should')) return 'high'
    if (lowerSuggestion.includes('consider') || lowerSuggestion.includes('could')) return 'medium'
    return 'high'
  }

  const getSuggestionCategory = (suggestion) => {
    const lowerSuggestion = suggestion.toLowerCase()
    if (lowerSuggestion.includes('keyword')) return 'Keywords'
    if (lowerSuggestion.includes('experience') || lowerSuggestion.includes('skill')) return 'Experience'
    if (lowerSuggestion.includes('format') || lowerSuggestion.includes('bullet')) return 'Formatting'
    if (lowerSuggestion.includes('quantify') || lowerSuggestion.includes('number')) return 'Metrics'
    if (lowerSuggestion.includes('contact') || lowerSuggestion.includes('info')) return 'Contact Info'
    if (lowerSuggestion.includes('action') || lowerSuggestion.includes('verb')) return 'Action Verbs'
    return 'Content'
  }

  const getSuggestionImpact = (suggestion) => {
    const lowerSuggestion = suggestion.toLowerCase()
    if (lowerSuggestion.includes('keyword')) return '+5-10 ATS points'
    if (lowerSuggestion.includes('quantify')) return '+10-15 ATS points'
    if (lowerSuggestion.includes('format')) return '+3-7 ATS points'
    if (lowerSuggestion.includes('contact')) return '+5 ATS points'
    if (lowerSuggestion.includes('action')) return '+3-5 ATS points'
    return '+5-12 ATS points'
  }

  const handleFixWithAI = async (suggestion) => {
    setLoadingOptimizations(prev => ({ ...prev, [suggestion.id]: true }))
    
    try {
      const response = await optimizeContent(suggestion.text, suggestion.type, {
        resume_content: activeTab === 'structured' ? JSON.stringify(structuredResume) : resumeContent,
        job_description: jobDescription,
        suggestion_category: suggestion.category
      });
      
      if (response.ok) {
        const result = await response.json()
        setOptimizedSuggestions(prev => ({
          ...prev,
          [suggestion.id]: result.optimized_content
        }))
      } else {
        // Fallback with enhanced suggestions
        const fallbackOptimization = generateFallbackOptimization(suggestion)
        setOptimizedSuggestions(prev => ({
          ...prev,
          [suggestion.id]: fallbackOptimization
        }))
      }
    } catch (error) {
      console.error('Error optimizing content:', error)
      const fallbackOptimization = generateFallbackOptimization(suggestion)
      setOptimizedSuggestions(prev => ({
        ...prev,
        [suggestion.id]: fallbackOptimization
      }))
    }
    
    setLoadingOptimizations(prev => ({ ...prev, [suggestion.id]: false }))
  }

  const generateFallbackOptimization = (suggestion) => {
    const examples = {
      keyword: `Example: Add "${suggestion.keyword || 'relevant skill'}" to your skills section or work experience bullets.`,
      quantify: `Example: Change "Responsible for managing team" to "Managed a team of 8 members, resulting in 25% increase in productivity"`,
      format: `Example: Use bullet points like:\n• Achieved X result by doing Y\n• Improved Z process, resulting in A% increase`,
      experience: `Example: Add specific examples like:\n• Led implementation of new sales process, resulting in 30% increase in lead conversion\n• Trained 15+ new agents on company procedures and best practices`,
      contact: `Example: Ensure your contact information includes:\n• Full name\n• Professional email address\n• Phone number\n• LinkedIn profile\n• Location (city, state)`,
      action: `Example: Start bullet points with strong action verbs like:\n• "Developed" instead of "Was responsible for"\n• "Implemented" instead of "Helped with"\n• "Managed" instead of "Assisted with"`
    }
    
    return examples[suggestion.type] || `Consider enhancing this area with specific examples, metrics, and relevant keywords from the job description.`
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-blue-600 bg-blue-50 border-blue-200'
    }
  }

  const getPriorityIcon = (type) => {
    switch (type) {
      case 'keyword': return <Target className="h-4 w-4" />
      case 'quantify': return <TrendingUp className="h-4 w-4" />
      case 'experience': return <Lightbulb className="h-4 w-4" />
      case 'contact': return <FileText className="h-4 w-4" />
      case 'action': return <Zap className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  // Function to export resume to PDF
  const handleExportToPDF = () => {
    if (activeTab === 'structured') {
      exportToPDF(structuredResume)
    } else {
      // For freeform, we'll create a simple text version
      const textResume = {
        contact: { name: "Freeform Resume" },
        summary: resumeContent,
        experience: [],
        education: [],
        skills: []
      }
      exportToPDF(textResume)
    }
  }

  const handlePDFUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.pdf')) {
      alert('Please upload a PDF file');
      return;
    }
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await uploadResume(formData);
      
      console.log('Upload response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Upload result:', result);
        
        if (result.success) {
          // Check if the parsed data has content
          if (result.data) {
            // Update the structured resume with the parsed data
            setStructuredResume(result.data);
            // Convert to freeform as well
            const freeform = convertStructuredToFreeform(result.data);
            setResumeContent(freeform);
            setActiveTab('structured');
            
            // Show success message
            alert('Resume uploaded and parsed successfully!');
          } else {
            // If no data was parsed, put the text in the summary field
            const fallbackData = {
              contact: {
                name: "",
                email: "",
                phone: "",
                location: "",
                linkedin: ""
              },
              summary: "Uploaded resume content - please review and edit the information below.",
              experience: [],
              education: [],
              skills: []
            };
            setStructuredResume(fallbackData);
            setResumeContent(fallbackData.summary);
            setActiveTab('structured');
            alert('Resume uploaded. Please review and edit the information in the structured editor.');
          }
        } else {
          // Try fallback approach
          const fallbackData = {
            contact: {
              name: "",
              email: "",
              phone: "",
              location: "",
              linkedin: ""
            },
            summary: "Uploaded resume content - please review and edit the information below.",
            experience: [],
            education: [],
            skills: []
          };
          setStructuredResume(fallbackData);
          setResumeContent(fallbackData.summary);
          setActiveTab('structured');
          alert('Resume uploaded but parsing failed. Please manually enter your information in the structured editor.');
        }
      } else {
        const errorText = await response.text();
        console.error('Upload error response:', errorText);
        // Try fallback approach
        const fallbackData = {
            contact: {
              name: "",
              email: "",
              phone: "",
              location: "",
              linkedin: ""
            },
            summary: "Uploaded resume content - please review and edit the information below.",
            experience: [],
            education: [],
            skills: []
        };
        setStructuredResume(fallbackData);
        setResumeContent(fallbackData.summary);
        setActiveTab('structured');
        alert('Failed to upload the resume. Please manually enter your information in the structured editor.');
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      // Try fallback approach
      const fallbackData = {
          contact: {
            name: "",
            email: "",
            phone: "",
            location: "",
            linkedin: ""
          },
          summary: "Uploaded resume content - please review and edit the information below.",
          experience: [],
          education: [],
          skills: []
        };
        setStructuredResume(fallbackData);
        setResumeContent(fallbackData.summary);
        setActiveTab('structured');
        alert('Failed to upload the resume. Please manually enter your information in the structured editor. Error: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">ResumeAI Pro</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline">Free Trial</Badge>
              <Button variant="outline">Sign In</Button>
              <Button>Get Started</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Get 3x More Interviews with AI-Optimized Resumes
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            The only AI resume builder that guarantees better ATS scores and more interview calls
          </p>
          <div className="flex justify-center space-x-8 mb-8">
            <div className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">Real-time ATS Scoring</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">AI-Powered Optimization</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-600">3x Interview Guarantee</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Application */}
      <section className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Resume Editor */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Resume Builder</CardTitle>
                  <CardDescription>
                    Create and edit your resume with real-time ATS optimization
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="structured">Structured Editor</TabsTrigger>
                      <TabsTrigger value="freeform">Freeform Editor</TabsTrigger>
                    </TabsList>
                    <TabsContent value="structured" className="mt-4">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload PDF Resume
                        </label>
                        <div className="flex items-center space-x-2">
                          <Input
                            type="file"
                            accept=".pdf"
                            onChange={handlePDFUpload}
                            disabled={isUploading}
                            className="w-full"
                          />
                          {isUploading && (
                            <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Upload your existing PDF resume to automatically populate the fields below
                        </p>
                      </div>
                      <StructuredResumeEditor 
                        resumeData={structuredResume}
                        setResumeData={(data) => {
                          if (JSON.stringify(data) !== JSON.stringify(structuredResume)) {
                            setStructuredResume(data);
                          }
                        }}
                        autoSaveStatus={autoSaveStatus}
                        lastSaved={lastSaved}
                        previewMode={previewMode}
                        setPreviewMode={setPreviewMode}
                      />
                    </TabsContent>
                    <TabsContent value="freeform" className="mt-4 space-y-4">
                      {/* Auto-save Status */}
                      <div className="flex items-center text-xs text-gray-500 mb-2 -mt-2">
                        <Save className={`h-3 w-3 mr-1 ${autoSaveStatus === 'saved' ? 'text-green-500' : autoSaveStatus === 'saving' ? 'text-blue-500' : 'text-gray-400'}`} />
                        {autoSaveStatus === 'saving' ? (
                          <span className="text-blue-600 font-medium">Auto-saving...</span>
                        ) : autoSaveStatus === 'saved' ? (
                          <span className="text-green-600 font-medium">All changes saved</span>
                        ) : (
                          <span>Auto-save enabled (every 5 seconds)</span>
                        )}
                        {lastSaved && autoSaveStatus !== 'saving' && (
                          <span className="ml-2 text-gray-400">
                            Last saved: {lastSaved.toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <label className="block text-sm font-medium text-gray-700">
                          Resume Content
                        </label>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={handleFormattingFix}
                            disabled={!resumeContent || isFormatting}
                          >
                            {isFormatting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                Formatting...
                              </>
                            ) : (
                              <>
                                <Zap className="h-4 w-4 mr-1" />
                                One-click Formatting Fix
                              </>
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => setPreviewMode(!previewMode)}
                          >
                            {previewMode ? (
                              <><EyeOff className="h-4 w-4 mr-1" />Hide Preview</>
                            ) : (
                              <><Eye className="h-4 w-4 mr-1" />Live Preview</>
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={handleExportToPDF}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Export PDF
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        placeholder="Paste your resume content here or start typing..."
                        value={resumeContent}
                        onChange={(e) => setResumeContent(e.target.value)}
                        className="min-h-[400px]"
                      />
                      
                      {/* Live Preview Panel */}
                      {previewMode && (
                        <div className="mt-4 border rounded-lg p-4 bg-gray-50">
                          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            Live Preview
                          </h4>
                          <div className="bg-white border rounded p-3 min-h-[100px]">
                            <pre className="whitespace-pre-wrap text-xs">
                              {resumeContent || "Your formatted resume will appear here..."}
                            </pre>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* ATS Analysis Panel */}
            <div className="space-y-6">
              
              {/* Job Description Input */}
              <Card>
                <CardHeader>
                  <CardTitle>Job Description</CardTitle>
                  <CardDescription>
                    Paste the job description to optimize your resume
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Paste the job description here..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    className="min-h-[150px]"
                  />
                  <Button 
                    onClick={analyzeResumeHandler}
                    disabled={(!resumeContent && activeTab === 'freeform') || !jobDescription || isAnalyzing}
                    className="w-full mt-4"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze ATS Score'
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* ATS Score */}
              {atsScore > 0 && (
                <Card className={getScoreBackground(atsScore)}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      ATS Score
                      <span className={`text-3xl font-bold ${getScoreColor(atsScore)}`}>
                        {atsScore}%
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress value={atsScore} className="mb-4" />
                    <p className="text-sm text-gray-600">
                      {atsScore >= 80 ? 'Excellent! Your resume is well-optimized.' :
                       atsScore >= 60 ? 'Good, but there\'s room for improvement.' :
                       'Needs work. Follow the suggestions below.'}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* What's Wrong List */}
              {whatsWrongList.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <span>What's Wrong</span>
                      <Badge variant="destructive">{whatsWrongList.length} issues</Badge>
                    </CardTitle>
                    <CardDescription>
                      Specific issues that need to be addressed
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {whatsWrongList.map((issue, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{issue}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Enhanced Suggestions */}
              {suggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Lightbulb className="h-5 w-5 text-blue-600" />
                      <span>AI Optimization Suggestions</span>
                      <Badge variant="outline">{suggestions.length} improvements</Badge>
                    </CardTitle>
                    <CardDescription>
                      Click "Fix with AI" to get detailed optimization examples
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {suggestions.map((suggestion) => (
                        <div 
                          key={suggestion.id} 
                          className={`border rounded-lg p-4 ${getPriorityColor(suggestion.priority)}`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {getPriorityIcon(suggestion.type)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge variant="secondary" className="text-xs">
                                  {suggestion.category}
                                </Badge>
                                <Badge 
                                  variant={suggestion.priority === 'critical' ? 'destructive' : 'outline'} 
                                  className="text-xs"
                                >
                                  {suggestion.priority.toUpperCase()}
                                </Badge>
                                <span className="text-xs text-green-600 font-medium">
                                  {suggestion.impact}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                                {suggestion.text}
                              </p>
                              
                              {optimizedSuggestions[suggestion.id] && (
                                <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-3">
                                  <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    AI Optimization Example:
                                  </h4>
                                  
                                  {/* Before/After Toggle */}
                                  {showBeforeAfter[suggestion.id] ? (
                                    <div className="space-y-4">
                                      <div>
                                        <h5 className="text-xs font-medium text-gray-700 mb-1">Before:</h5>
                                        <div className="bg-red-50 border border-red-200 rounded p-2">
                                          <p className="text-xs text-red-800 whitespace-pre-line">
                                            {suggestion.text}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex justify-center">
                                        <ArrowLeftRight className="h-4 w-4 text-gray-500" />
                                      </div>
                                      <div>
                                        <h5 className="text-xs font-medium text-gray-700 mb-1">After:</h5>
                                        <div className="bg-green-100 border border-green-300 rounded p-2">
                                          <div className="text-xs text-green-800 whitespace-pre-line">
                                            {optimizedSuggestions[suggestion.id]}
                                          </div>
                                        </div>
                                      </div>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={() => toggleBeforeAfter(suggestion.id)}
                                        className="w-full"
                                      >
                                        Show Combined View
                                      </Button>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="text-sm text-green-700 whitespace-pre-line">
                                        {optimizedSuggestions[suggestion.id]}
                                      </div>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        onClick={() => toggleBeforeAfter(suggestion.id)}
                                        className="w-full mt-2"
                                      >
                                        <ArrowLeftRight className="h-4 w-4 mr-1" />
                                        Show Before/After Comparison
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <Button 
                                size="sm" 
                                variant={optimizedSuggestions[suggestion.id] ? "outline" : "default"}
                                className="mt-2"
                                onClick={() => handleFixWithAI(suggestion)}
                                disabled={loadingOptimizations[suggestion.id]}
                              >
                                {loadingOptimizations[suggestion.id] ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Optimizing...
                                  </>
                                ) : optimizedSuggestions[suggestion.id] ? (
                                  <>
                                    <Zap className="h-4 w-4 mr-2" />
                                    Get New Example
                                  </>
                                ) : (
                                  <>
                                    <Zap className="h-4 w-4 mr-2" />
                                    Fix with AI
                                  </>
                                )}
                              </Button>
                              
                              {/* Before/After Toggle */}
                              {optimizedSuggestions[suggestion.id] && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="mt-2 ml-2"
                                  onClick={() => toggleBeforeAfter(suggestion.id)}
                                >
                                  <ArrowLeftRight className="h-4 w-4 mr-1" />
                                  Compare
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Summary Stats */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Optimization Summary</h4>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-blue-700">Potential ATS Boost:</span>
                          <span className="font-medium text-blue-900 ml-1">
                            +{Math.min(suggestions.length * 8, 40)} points
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-700">Categories:</span>
                          <span className="font-medium text-blue-900 ml-1">
                            {[...new Set(suggestions.map(s => s.category))].length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 ResumeAI Pro. Built with AI to help you land your dream job.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App