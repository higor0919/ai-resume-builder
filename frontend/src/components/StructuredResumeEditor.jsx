import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Edit, Save, Eye, EyeOff, Download, Plus, Trash2 } from 'lucide-react'

const StructuredResumeEditor = ({ 
  resumeData, 
  setResumeData, 
  autoSaveStatus, 
  lastSaved,
  previewMode,
  setPreviewMode
}) => {
  const [editingSection, setEditingSection] = useState(null)
  const [sectionData, setSectionData] = useState({})
  const [newExperience, setNewExperience] = useState({
    company: '',
    position: '',
    startDate: '',
    endDate: '',
    description: ''
  })
  const [newEducation, setNewEducation] = useState({
    institution: '',
    degree: '',
    startDate: '',
    endDate: ''
  })
  const [newSkill, setNewSkill] = useState('')

  // Refs to prevent infinite loops
  const previousResumeDataRef = useRef(resumeData);
  const isUpdatingRef = useRef(false);

  // Initialize section data when resumeData changes
  useEffect(() => {
    // Only update if the resumeData actually changed
    if (JSON.stringify(resumeData) !== JSON.stringify(previousResumeDataRef.current) && !isUpdatingRef.current) {
      isUpdatingRef.current = true;
      setSectionData(resumeData);
      previousResumeDataRef.current = resumeData;
      // Reset the updating flag after a short delay
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [resumeData]);

  // Update parent when sectionData changes (for saving)
  useEffect(() => {
    // Only update parent if sectionData is different from resumeData and we're not currently updating
    if (JSON.stringify(sectionData) !== JSON.stringify(resumeData) && !isUpdatingRef.current) {
      isUpdatingRef.current = true;
      setResumeData(sectionData);
      // Reset the updating flag after a short delay
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [sectionData, resumeData, setResumeData]);

  const handleEditSection = (section) => {
    setEditingSection(section)
  }

  const handleSaveSection = () => {
    setResumeData(sectionData)
    setEditingSection(null)
  }

  const handleCancelEdit = () => {
    setSectionData(resumeData)
    setEditingSection(null)
  }

  const addExperience = () => {
    if (newExperience.company && newExperience.position) {
      setSectionData(prev => ({
        ...prev,
        experience: [...(prev.experience || []), { ...newExperience, id: Date.now() }]
      }))
      setNewExperience({
        company: '',
        position: '',
        startDate: '',
        endDate: '',
        description: ''
      })
    }
  }

  const removeExperience = (id) => {
    setSectionData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }))
  }

  const addEducation = () => {
    if (newEducation.institution && newEducation.degree) {
      setSectionData(prev => ({
        ...prev,
        education: [...(prev.education || []), { ...newEducation, id: Date.now() }]
      }))
      setNewEducation({
        institution: '',
        degree: '',
        startDate: '',
        endDate: ''
      })
    }
  }

  const removeEducation = (id) => {
    setSectionData(prev => ({
      ...prev,
      education: prev.education.filter(edu => edu.id !== id)
    }))
  }

  const addSkill = () => {
    if (newSkill.trim()) {
      setSectionData(prev => ({
        ...prev,
        skills: [...(prev.skills || []), newSkill.trim()]
      }))
      setNewSkill('')
    }
  }

  const removeSkill = (skill) => {
    setSectionData(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s !== skill)
    }))
  }

  const renderEditableSection = (section, title, content) => {
    if (editingSection === section) {
      return (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">{title}</h3>
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleSaveSection}>
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
          {content}
        </div>
      )
    }
    
    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Button size="sm" variant="ghost" onClick={() => handleEditSection(section)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
        {content}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Structured Resume Builder</CardTitle>
        <CardDescription>
          Build your resume with structured sections for better ATS optimization
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Auto-save Status */}
        <div className="flex items-center text-xs text-gray-500 mb-4 -mt-2">
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

        <div className="space-y-6">
          {/* Contact Info Section */}
          {renderEditableSection(
            'contact',
            'Contact Information',
            editingSection === 'contact' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Full Name</label>
                  <Input
                    value={sectionData.contact?.name || ''}
                    onChange={(e) => setSectionData(prev => ({
                      ...prev,
                      contact: { ...prev.contact, name: e.target.value }
                    }))}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <Input
                    value={sectionData.contact?.email || ''}
                    onChange={(e) => setSectionData(prev => ({
                      ...prev,
                      contact: { ...prev.contact, email: e.target.value }
                    }))}
                    placeholder="john.doe@example.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <Input
                    value={sectionData.contact?.phone || ''}
                    onChange={(e) => setSectionData(prev => ({
                      ...prev,
                      contact: { ...prev.contact, phone: e.target.value }
                    }))}
                    placeholder="(123) 456-7890"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Location</label>
                  <Input
                    value={sectionData.contact?.location || ''}
                    onChange={(e) => setSectionData(prev => ({
                      ...prev,
                      contact: { ...prev.contact, location: e.target.value }
                    }))}
                    placeholder="City, State"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-700">LinkedIn</label>
                  <Input
                    value={sectionData.contact?.linkedin || ''}
                    onChange={(e) => setSectionData(prev => ({
                      ...prev,
                      contact: { ...prev.contact, linkedin: e.target.value }
                    }))}
                    placeholder="https://linkedin.com/in/username"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">{sectionData.contact?.name || 'Your Name'}</p>
                <p className="text-sm text-gray-600">{sectionData.contact?.email || 'email@example.com'}</p>
                <p className="text-sm text-gray-600">{sectionData.contact?.phone || '(123) 456-7890'}</p>
                <p className="text-sm text-gray-600">{sectionData.contact?.location || 'City, State'}</p>
                {sectionData.contact?.linkedin && (
                  <p className="text-sm text-blue-600">{sectionData.contact.linkedin}</p>
                )}
              </div>
            )
          )}

          {/* Professional Summary Section */}
          {renderEditableSection(
            'summary',
            'Professional Summary',
            editingSection === 'summary' ? (
              <Textarea
                value={sectionData.summary || ''}
                onChange={(e) => setSectionData(prev => ({
                  ...prev,
                  summary: e.target.value
                }))}
                placeholder="Write a compelling summary of your professional background, skills, and career goals..."
                className="min-h-[120px]"
              />
            ) : (
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-line">
                  {sectionData.summary || 'Your professional summary will appear here...'}
                </p>
              </div>
            )
          )}

          {/* Experience Section */}
          {renderEditableSection(
            'experience',
            'Work Experience',
            editingSection === 'experience' ? (
              <div className="space-y-4">
                {sectionData.experience?.map((exp) => (
                  <div key={exp.id} className="border rounded-lg p-4 relative">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => removeExperience(exp.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Company</label>
                        <Input
                          value={exp.company}
                          onChange={(e) => setSectionData(prev => ({
                            ...prev,
                            experience: prev.experience.map(item => 
                              item.id === exp.id ? { ...item, company: e.target.value } : item
                            )
                          }))}
                          placeholder="Company Name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Position</label>
                        <Input
                          value={exp.position}
                          onChange={(e) => setSectionData(prev => ({
                            ...prev,
                            experience: prev.experience.map(item => 
                              item.id === exp.id ? { ...item, position: e.target.value } : item
                            )
                          }))}
                          placeholder="Job Title"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Start Date</label>
                        <Input
                          value={exp.startDate}
                          onChange={(e) => setSectionData(prev => ({
                            ...prev,
                            experience: prev.experience.map(item => 
                              item.id === exp.id ? { ...item, startDate: e.target.value } : item
                            )
                          }))}
                          placeholder="MM/YYYY"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">End Date</label>
                        <Input
                          value={exp.endDate}
                          onChange={(e) => setSectionData(prev => ({
                            ...prev,
                            experience: prev.experience.map(item => 
                              item.id === exp.id ? { ...item, endDate: e.target.value } : item
                            )
                          }))}
                          placeholder="MM/YYYY or Present"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <Textarea
                          value={exp.description}
                          onChange={(e) => setSectionData(prev => ({
                            ...prev,
                            experience: prev.experience.map(item => 
                              item.id === exp.id ? { ...item, description: e.target.value } : item
                            )
                          }))}
                          placeholder="Describe your responsibilities and achievements..."
                          className="min-h-[80px]"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Add new experience form */}
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h4 className="font-medium mb-3">Add New Experience</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Company</label>
                      <Input
                        value={newExperience.company}
                        onChange={(e) => setNewExperience(prev => ({ ...prev, company: e.target.value }))}
                        placeholder="Company Name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Position</label>
                      <Input
                        value={newExperience.position}
                        onChange={(e) => setNewExperience(prev => ({ ...prev, position: e.target.value }))}
                        placeholder="Job Title"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Start Date</label>
                      <Input
                        value={newExperience.startDate}
                        onChange={(e) => setNewExperience(prev => ({ ...prev, startDate: e.target.value }))}
                        placeholder="MM/YYYY"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">End Date</label>
                      <Input
                        value={newExperience.endDate}
                        onChange={(e) => setNewExperience(prev => ({ ...prev, endDate: e.target.value }))}
                        placeholder="MM/YYYY or Present"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <Textarea
                        value={newExperience.description}
                        onChange={(e) => setNewExperience(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe your responsibilities and achievements..."
                        className="min-h-[80px]"
                      />
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="mt-3"
                    onClick={addExperience}
                    disabled={!newExperience.company || !newExperience.position}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Experience
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {sectionData.experience?.length > 0 ? (
                  sectionData.experience.map((exp) => (
                    <div key={exp.id} className="border rounded-lg p-4">
                      <div className="flex justify-between">
                        <h4 className="font-semibold">{exp.position}</h4>
                        <span className="text-sm text-gray-500">{exp.startDate} - {exp.endDate}</span>
                      </div>
                      <p className="text-gray-700">{exp.company}</p>
                      <p className="text-gray-600 whitespace-pre-line mt-2">{exp.description}</p>
                    </div>
                  ))
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-gray-500">No work experience added yet</p>
                  </div>
                )}
              </div>
            )
          )}

          {/* Education Section */}
          {renderEditableSection(
            'education',
            'Education',
            editingSection === 'education' ? (
              <div className="space-y-4">
                {sectionData.education?.map((edu) => (
                  <div key={edu.id} className="border rounded-lg p-4 relative">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2"
                      onClick={() => removeEducation(edu.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Institution</label>
                        <Input
                          value={edu.institution}
                          onChange={(e) => setSectionData(prev => ({
                            ...prev,
                            education: prev.education.map(item => 
                              item.id === edu.id ? { ...item, institution: e.target.value } : item
                            )
                          }))}
                          placeholder="University Name"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Degree</label>
                        <Input
                          value={edu.degree}
                          onChange={(e) => setSectionData(prev => ({
                            ...prev,
                            education: prev.education.map(item => 
                              item.id === edu.id ? { ...item, degree: e.target.value } : item
                            )
                          }))}
                          placeholder="Bachelor of Science"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Start Date</label>
                        <Input
                          value={edu.startDate}
                          onChange={(e) => setSectionData(prev => ({
                            ...prev,
                            education: prev.education.map(item => 
                              item.id === edu.id ? { ...item, startDate: e.target.value } : item
                            )
                          }))}
                          placeholder="MM/YYYY"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">End Date</label>
                        <Input
                          value={edu.endDate}
                          onChange={(e) => setSectionData(prev => ({
                            ...prev,
                            education: prev.education.map(item => 
                              item.id === edu.id ? { ...item, endDate: e.target.value } : item
                            )
                          }))}
                          placeholder="MM/YYYY"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Add new education form */}
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h4 className="font-medium mb-3">Add New Education</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Institution</label>
                      <Input
                        value={newEducation.institution}
                        onChange={(e) => setNewEducation(prev => ({ ...prev, institution: e.target.value }))}
                        placeholder="University Name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Degree</label>
                      <Input
                        value={newEducation.degree}
                        onChange={(e) => setNewEducation(prev => ({ ...prev, degree: e.target.value }))}
                        placeholder="Bachelor of Science"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Start Date</label>
                      <Input
                        value={newEducation.startDate}
                        onChange={(e) => setNewEducation(prev => ({ ...prev, startDate: e.target.value }))}
                        placeholder="MM/YYYY"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">End Date</label>
                      <Input
                        value={newEducation.endDate}
                        onChange={(e) => setNewEducation(prev => ({ ...prev, endDate: e.target.value }))}
                        placeholder="MM/YYYY"
                      />
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="mt-3"
                    onClick={addEducation}
                    disabled={!newEducation.institution || !newEducation.degree}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Education
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {sectionData.education?.length > 0 ? (
                  sectionData.education.map((edu) => (
                    <div key={edu.id} className="border rounded-lg p-4">
                      <div className="flex justify-between">
                        <h4 className="font-semibold">{edu.degree}</h4>
                        <span className="text-sm text-gray-500">{edu.startDate} - {edu.endDate}</span>
                      </div>
                      <p className="text-gray-700">{edu.institution}</p>
                    </div>
                  ))
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <p className="text-gray-500">No education added yet</p>
                  </div>
                )}
              </div>
            )
          )}

          {/* Skills Section */}
          {renderEditableSection(
            'skills',
            'Skills',
            editingSection === 'skills' ? (
              <div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {sectionData.skills?.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1.5 text-sm">
                      {skill}
                      <button 
                        onClick={() => removeSkill(skill)}
                        className="ml-2 text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addSkill()
                      }
                    }}
                  />
                  <Button onClick={addSkill} disabled={!newSkill.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sectionData.skills?.length > 0 ? (
                  sectionData.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1.5 text-sm">
                      {skill}
                    </Badge>
                  ))
                ) : (
                  <div className="bg-gray-50 p-4 rounded-lg text-center w-full">
                    <p className="text-gray-500">No skills added yet</p>
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between mt-6">
          <Button 
            variant="outline" 
            onClick={() => setPreviewMode(!previewMode)}
          >
            {previewMode ? (
              <><EyeOff className="h-4 w-4 mr-1" />Hide Preview</>
            ) : (
              <><Eye className="h-4 w-4 mr-1" />Live Preview</>
            )}
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-1" />
            Export to PDF
          </Button>
        </div>

        {/* Live Preview Panel */}
        {previewMode && (
          <div className="mt-6 border rounded-lg p-4 bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              Live Preview
            </h4>
            <div className="bg-white border rounded p-3 min-h-[200px]">
              <div className="space-y-4">
                {/* Contact Information Preview */}
                {sectionData.contact?.name && (
                  <div>
                    <h3 className="text-lg font-bold">{sectionData.contact.name}</h3>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                      {sectionData.contact.email && <span>{sectionData.contact.email}</span>}
                      {sectionData.contact.email && sectionData.contact.phone && <span>|</span>}
                      {sectionData.contact.phone && <span>{sectionData.contact.phone}</span>}
                      {(sectionData.contact.email || sectionData.contact.phone) && sectionData.contact.location && <span>|</span>}
                      {sectionData.contact.location && <span>{sectionData.contact.location}</span>}
                    </div>
                    {sectionData.contact.linkedin && (
                      <div className="text-sm text-blue-600">{sectionData.contact.linkedin}</div>
                    )}
                  </div>
                )}

                {/* Professional Summary Preview */}
                {sectionData.summary && (
                  <div>
                    <h4 className="font-semibold text-gray-900 border-b pb-1">PROFESSIONAL SUMMARY</h4>
                    <p className="text-sm mt-2 whitespace-pre-line">{sectionData.summary}</p>
                  </div>
                )}

                {/* Work Experience Preview */}
                {sectionData.experience?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 border-b pb-1">WORK EXPERIENCE</h4>
                    <div className="mt-2 space-y-4">
                      {sectionData.experience.map((exp, index) => (
                        <div key={index} className="text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{exp.position}</span>
                            <span className="text-gray-600">{exp.startDate} - {exp.endDate}</span>
                          </div>
                          <div className="text-gray-700">{exp.company}</div>
                          {exp.description && (
                            <div className="mt-1 whitespace-pre-line text-gray-600">{exp.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education Preview */}
                {sectionData.education?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 border-b pb-1">EDUCATION</h4>
                    <div className="mt-2 space-y-4">
                      {sectionData.education.map((edu, index) => (
                        <div key={index} className="text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">{edu.degree}</span>
                            <span className="text-gray-600">{edu.startDate} - {edu.endDate}</span>
                          </div>
                          <div className="text-gray-700">{edu.institution}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills Preview */}
                {sectionData.skills?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-900 border-b pb-1">SKILLS</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sectionData.skills.map((skill, index) => (
                        <span key={index} className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default StructuredResumeEditor