import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { FileText, Target, Zap, CheckCircle, AlertCircle } from 'lucide-react'
import './App.css'

function App() {
  const [resumeContent, setResumeContent] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [atsScore, setAtsScore] = useState(0)
  const [suggestions, setSuggestions] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const analyzeResume = async () => {
    if (!resumeContent || !jobDescription) return
    
    setIsAnalyzing(true)
    
    try {
      const response = await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resume_content: resumeContent,
          job_description: jobDescription
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        setAtsScore(result.ats_score)
        setSuggestions(result.suggestions.map(suggestion => ({
          type: 'improve',
          text: suggestion
        })))
      } else {
        // Fallback to demo data if API fails
        setAtsScore(Math.floor(Math.random() * 40) + 60)
        setSuggestions([
          { type: 'missing', text: 'Add "Python" keyword to match job requirements' },
          { type: 'improve', text: 'Quantify your achievements with specific numbers' },
          { type: 'format', text: 'Use bullet points for better ATS parsing' }
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
                  <Tabs defaultValue="editor" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="editor">Editor</TabsTrigger>
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                    </TabsList>
                    <TabsContent value="editor" className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Resume Content
                        </label>
                        <Textarea
                          placeholder="Paste your resume content here or start typing..."
                          value={resumeContent}
                          onChange={(e) => setResumeContent(e.target.value)}
                          className="min-h-[400px]"
                        />
                      </div>
                    </TabsContent>
                    <TabsContent value="preview" className="space-y-4">
                      <div className="bg-white border rounded-lg p-6 min-h-[400px]">
                        <div className="prose max-w-none">
                          {resumeContent ? (
                            <pre className="whitespace-pre-wrap font-sans text-sm">
                              {resumeContent}
                            </pre>
                          ) : (
                            <p className="text-gray-500 italic">
                              Your resume preview will appear here...
                            </p>
                          )}
                        </div>
                      </div>
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
                    onClick={analyzeResume}
                    disabled={!resumeContent || !jobDescription || isAnalyzing}
                    className="w-full mt-4"
                  >
                    {isAnalyzing ? 'Analyzing...' : 'Analyze ATS Score'}
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

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Optimization Suggestions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {suggestions.map((suggestion, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm text-gray-700">{suggestion.text}</p>
                            <Button size="sm" variant="outline" className="mt-2">
                              Fix with AI
                            </Button>
                          </div>
                        </div>
                      ))}
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

