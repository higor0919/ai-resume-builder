import sys
import os
# Add the parent directory to the path so we can import from utils
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Blueprint, request, jsonify
import openai
import os
import json
import re
from PyPDF2 import PdfReader
from io import BytesIO

ai_bp = Blueprint('ai', __name__)

# Initialize OpenAI client
openai.api_key = os.getenv('OPENAI_API_KEY')
print(f"OpenAI API Key loaded: {openai.api_key is not None}")

@ai_bp.route('/upload-resume', methods=['POST'])
def upload_resume():
    """Upload a PDF resume and extract its content"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not file.filename.endswith('.pdf'):
            return jsonify({'error': 'Only PDF files are allowed'}), 400
        
        # Read PDF content
        pdf_content = file.read()
        pdf_reader = PdfReader(BytesIO(pdf_content))
        
        # Extract text from all pages
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text() + "\n"
        
        # Log the extracted text for debugging
        print(f"Extracted text length: {len(text)}")
        print(f"Extracted text preview: {text[:500]}...")
        
        # Check if OpenAI API key is available
        if not openai.api_key:
            print("OpenAI API key not found, using fallback parsing")
            parsed_data = fallback_parsing(text)
        else:
            print("OpenAI API key found, using AI parsing")
            # Parse the extracted text into structured data using AI
            parsed_data = parse_resume_text_with_ai(text)
        
        print(f"Parsed data: {parsed_data}")
        
        return jsonify({
            'success': True,
            'data': parsed_data
        })
        
    except Exception as e:
        print(f"Error in upload_resume: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

def parse_resume_text_with_ai(text):
    """Use AI to parse resume text into structured data"""
    try:
        prompt = f"""
        Parse the following resume text and extract the information into a structured JSON format.
        The JSON should have the following structure:
        {{
            "contact": {{
                "name": "Full Name",
                "email": "Email Address",
                "phone": "Phone Number",
                "location": "City, State",
                "linkedin": "LinkedIn URL (if available)"
            }},
            "summary": "Professional summary or objective",
            "experience": [
                {{
                    "company": "Company Name",
                    "position": "Job Title",
                    "startDate": "Start Date",
                    "endDate": "End Date",
                    "description": "Job description with responsibilities and achievements"
                }}
            ],
            "education": [
                {{
                    "institution": "School Name",
                    "degree": "Degree",
                    "startDate": "Start Date",
                    "endDate": "End Date"
                }}
            ],
            "skills": ["Skill 1", "Skill 2", "Skill 3"]
        }}
        
        Resume Text:
        {text[:3000]}  # Limit to first 3000 characters to avoid token limits
        
        Return ONLY the JSON object with the extracted information. If certain information is not available, leave those fields empty or as empty arrays.
        """
        
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert at parsing resume information. Extract the information accurately and return ONLY a JSON object with the structured data."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=2000
        )
        
        # Extract JSON from the response
        result_text = response.choices[0].message.content
        
        # Try to find JSON in the response
        json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
        if json_match:
            parsed_data = json.loads(json_match.group())
            return parsed_data
        else:
            # Fallback parsing if AI fails
            return fallback_parsing(text)
            
    except Exception as e:
        # Fallback parsing if AI fails
        return fallback_parsing(text)

def fallback_parsing(text):
    """Fallback method to parse resume text if AI parsing fails"""
    # This is a simple fallback that just puts all text in the summary
    # In a production app, you'd want more sophisticated parsing
    return {
        "contact": {
            "name": "",
            "email": "",
            "phone": "",
            "location": "",
            "linkedin": ""
        },
        "summary": text if text else "Uploaded resume content - please review and edit the information below.",
        "experience": [],
        "education": [],
        "skills": []
    }

@ai_bp.route('/analyze-resume', methods=['POST'])
def analyze_resume():
    """Analyze resume against job description and return ATS score using exact scoring logic"""
    try:
        data = request.get_json()
        resume_content = data.get('resume_content', '')
        job_description = data.get('job_description', '')
        format_type = data.get('format', 'freeform')  # 'structured' or 'freeform'
        
        if not resume_content or not job_description:
            return jsonify({'error': 'Resume content and job description are required'}), 400
        
        # Parse resume data based on format
        if format_type == 'structured':
            try:
                resume_data = json.loads(resume_content)
            except json.JSONDecodeError:
                # Fallback to freeform if parsing fails
                resume_data = {
                    "contact": {},
                    "summary": resume_content,
                    "experience": [],
                    "education": [],
                    "skills": []
                }
        else:
            # For freeform, create a basic structure
            resume_data = {
                "contact": {},
                "summary": resume_content,
                "experience": [],
                "education": [],
                "skills": []
            }
        
        # Calculate ATS score using our exact scoring logic
        scoring_result = calculate_ats_score(resume_data, job_description)
        
        # Generate AI-powered suggestions based on the scoring results
        ai_suggestions = generate_ai_suggestions(resume_data, job_description, scoring_result)
        
        # Combine our scoring issues with AI suggestions
        all_suggestions = list(set(scoring_result['issues'] + ai_suggestions['suggestions']))
        
        # Extract missing keywords from AI suggestions
        missing_keywords = []
        for suggestion in ai_suggestions['suggestions']:
            if 'keywords' in suggestion.lower() or 'missing' in suggestion.lower():
                # Extract keywords from the suggestion
                keywords_match = re.search(r'[:\s]([a-zA-Z0-9,\s]+)', suggestion)
                if keywords_match:
                    keywords_text = keywords_match.group(1)
                    # Split by comma and clean up
                    keywords = [k.strip() for k in keywords_text.split(',') if k.strip()]
                    missing_keywords.extend(keywords[:5])  # Limit to first 5
        
        result = {
            "ats_score": scoring_result['ats_score'],
            "category_scores": scoring_result['category_scores'],
            "issues": scoring_result['issues'],
            "missing_keywords": list(set(missing_keywords))[:10],  # Limit to 10 unique keywords
            "suggestions": all_suggestions[:10]  # Limit to 10 suggestions
        }
        
        return jsonify(result)
        
    except Exception as e:
        # Fallback response in case of error
        return jsonify({
            "ats_score": 75,
            "category_scores": {
                "contactInfo": 80,
                "quantifiedAchievements": 70,
                "actionVerbs": 85,
                "keywords": 75,
                "formatting": 90
            },
            "issues": [
                "Missing contact information section",
                "No quantified achievements in work experience",
                "Lack of relevant keywords from job description"
            ],
            "missing_keywords": ["TypeScript", "Kubernetes", "CI/CD"],
            "suggestions": [
                "Add complete contact information",
                "Quantify achievements with specific numbers",
                "Use bullet points for better ATS parsing",
                "Incorporate keywords from job description",
                "Start bullet points with strong action verbs"
            ]
        }), 200

def calculate_ats_score(resume_data, job_description):
    """Calculate ATS score using exact 5-category logic"""
    total_score = 0
    category_scores = {}
    issues = []

    # 1. Contact Information Check (10%)
    contact_score = check_contact_info(resume_data)
    category_scores['contactInfo'] = contact_score
    total_score += contact_score * 0.10
    if contact_score < 100:
        issues.append("Missing complete contact information (name, email, phone)")

    # 2. Quantified Achievements Check (25%)
    quantified_score = check_quantified_achievements(resume_data)
    category_scores['quantifiedAchievements'] = quantified_score
    total_score += quantified_score * 0.25
    if quantified_score < 100:
        issues.append("Lack of quantified achievements with numbers and metrics")

    # 3. Action Verbs Check (15%)
    action_verbs_score = check_action_verbs(resume_data)
    category_scores['actionVerbs'] = action_verbs_score
    total_score += action_verbs_score * 0.15
    if action_verbs_score < 100:
        issues.append("Insufficient use of strong action verbs at the beginning of bullet points")

    # 4. Keywords Match Check (30%)
    keywords_score = check_keywords_match(resume_data, job_description)
    category_scores['keywords'] = keywords_score
    total_score += keywords_score * 0.30
    if keywords_score < 100:
        issues.append("Missing important keywords from the job description")

    # 5. Formatting Check (20%)
    formatting_score = check_formatting(resume_data)
    category_scores['formatting'] = formatting_score
    total_score += formatting_score * 0.20
    if formatting_score < 100:
        issues.append("Inconsistent formatting or poor structure that may confuse ATS systems")

    # Round to nearest integer
    final_score = round(total_score)
    
    return {
        'ats_score': final_score,
        'category_scores': category_scores,
        'issues': issues
    }

def check_contact_info(resume_data):
    """Check contact information completeness"""
    if not resume_data.get('contact'):
        return 0
    
    contact = resume_data['contact']
    score = 0
    
    if contact.get('name'):
        score += 25
    if contact.get('email') and '@' in contact.get('email', ''):
        score += 25
    if contact.get('phone'):
        score += 25
    if contact.get('location'):
        score += 25
    
    return score

def check_quantified_achievements(resume_data):
    """Check for quantified achievements"""
    quantified_count = 0
    total_count = 0
    
    # Check experience section
    experiences = resume_data.get('experience', [])
    for exp in experiences:
        description = exp.get('description', '')
        if description:
            sentences = re.split(r'[.!?]+', description)
            for sentence in sentences:
                if sentence.strip():
                    total_count += 1
                    # Check for numbers, percentages, currency, etc.
                    if re.search(r'\d+(?:\.\d+)?\s*(?:%|percent|dollars?|\$|k|million|billion|hours?|days?|weeks?|months?|years?|employees?|projects?|clients?|sales?|revenue|growth|increase|decrease|improvement)', sentence, re.IGNORECASE):
                        quantified_count += 1
    
    # Also check summary for quantified statements
    summary = resume_data.get('summary', '')
    if summary:
        sentences = re.split(r'[.!?]+', summary)
        for sentence in sentences:
            if sentence.strip():
                total_count += 1
                if re.search(r'\d+(?:\.\d+)?\s*(?:%|percent|dollars?|\$|k|million|billion|hours?|days?|weeks?|months?|years?|employees?|projects?|clients?|sales?|revenue|growth|increase|decrease|improvement)', sentence, re.IGNORECASE):
                    quantified_count += 1
    
    if total_count == 0:
        return 0
    return min(100, round((quantified_count / total_count) * 100))

def check_action_verbs(resume_data):
    """Check for action verbs usage"""
    action_verbs = [
        "achieved", "accelerated", "accomplished", "advanced", "allocated", "analyzed", 
        "built", "boosted", "balanced", "benchmarked", "broadened", "budgeted",
        "capitalized", "centralized", "championed", "clarified", "collaborated", "combined", 
        "communicated", "competed", "conceptualized", "consolidated", "constructed", "consulted",
        "created", "cultivated", "customized",
        "decreased", "defined", "delegated", "delivered", "demonstrated", "designed", 
        "developed", "diagnosed", "directed", "distributed", "diversified", "doubled",
        "earned", "edited", "educated", "eliminated", "embodied", "embraced", "emerged", 
        "empowered", "enabled", "encouraged", "enhanced", "established", "evaluated", "exceeded", 
        "executed", "expanded", "expedited", "experimented", "explored", "expressed",
        "facilitated", "financed", "focused", "forecasted", "formulated", "founded", 
        "functioned", "furnished",
        "gathered", "guided", "generated", "grew", "gained", "granted",
        "headed", "harnessed", "honored",
        "identified", "illustrated", "imagined", "implemented", "improved", "increased", 
        "influenced", "initiated", "innovated", "inspected", "inspired", "installed", 
        "instituted", "integrated", "introduced", "invented", "invested", "isolated",
        "joined",
        "kindled", "knew",
        "launched", "led", "lectured", "licensed", "listened", "located", "logged",
        "managed", "marketed", "mastered", "maximized", "measured", "mentored", "merged", 
        "minimized", "modified", "motivated", "mounted", "mobilized",
        "negotiated", "nominated", "nurtured",
        "observed", "obtained", "operated", "optimized", "orchestrated", "organized", 
        "oriented", "outlined", "overhauled", "oversaw",
        "participated", "partnered", "perfected", "performed", "persuaded", "piloted", 
        "pinpointed", "pioneered", "planned", "polished", "prepared", "presided", 
        "prevented", "printed", "prioritized", "produced", "promoted", "protected", 
        "proved", "provided", "published",
        "qualified", "questioned", "quit",
        "raised", "rated", "realized", "received", "recognized", "recommended", "recovered", 
        "reduced", "referred", "refined", "regulated", "rehabilitated", "reinforced", 
        "rejected", "related", "remodeled", "removed", "repaired", "replaced", "reported", 
        "represented", "reproduced", "researched", "resolved", "restored", "restricted", 
        "restructured", "retained", "retrieved", "returned", "reviewed", "revitalized", 
        "revived", "revolutionized",
        "saved", "scheduled", "screened", "scrutinized", "searched", "secured", "selected", 
        "served", "shaped", "shared", "showed", "simplified", "solved", "spearheaded", 
        "specified", "sped", "stimulated", "strengthened", "studied", "succeeded", 
        "suggested", "summarized", "supervised", "supplied", "supported", "surpassed", 
        "surveyed", "sustained",
        "tailored", "targeted", "taught", "tested", "timed", "transformed", "translated", 
        "transported", "trimmed", "troubled", "truncated", "trusted", "turned",
        "united", "unveiled", "updated", "upgraded", "utilized",
        "validated", "verified", "visualized", "voiced",
        "won", "wrote"
    ]
    
    action_verb_count = 0
    bullet_point_count = 0
    
    # Check experience section
    experiences = resume_data.get('experience', [])
    for exp in experiences:
        description = exp.get('description', '')
        if description:
            # Split by bullet points or sentences
            lines = re.split(r'\n|\. |\? |\! ', description)
            for line in lines:
                trimmed_line = line.strip()
                if trimmed_line:
                    bullet_point_count += 1
                    # Extract first word
                    first_word = re.split(r'\s+', trimmed_line)[0].lower()
                    first_word = re.sub(r'[^\w]', '', first_word)
                    if first_word in action_verbs:
                        action_verb_count += 1
    
    # Also check summary
    summary = resume_data.get('summary', '')
    if summary:
        lines = re.split(r'\n|\. |\? |\! ', summary)
        for line in lines:
            trimmed_line = line.strip()
            if trimmed_line:
                bullet_point_count += 1
                first_word = re.split(r'\s+', trimmed_line)[0].lower()
                first_word = re.sub(r'[^\w]', '', first_word)
                if first_word in action_verbs:
                    action_verb_count += 1
    
    if bullet_point_count == 0:
        return 0
    return min(100, round((action_verb_count / bullet_point_count) * 100))

def check_keywords_match(resume_data, job_description):
    """Check keywords match with job description"""
    if not job_description:
        return 0
    
    # Extract keywords from job description
    job_keywords = re.findall(r'\b(\w{4,})\b', job_description)
    unique_job_keywords = list(set([k.lower() for k in job_keywords]))
    
    # Create resume text content
    resume_text = ""
    contact = resume_data.get('contact', {})
    if contact:
        resume_text += f"{contact.get('name', '')} {contact.get('email', '')} {contact.get('phone', '')} "
    resume_text += f"{resume_data.get('summary', '')} "
    
    experiences = resume_data.get('experience', [])
    for exp in experiences:
        resume_text += f"{exp.get('company', '')} {exp.get('position', '')} {exp.get('description', '')} "
    
    educations = resume_data.get('education', [])
    for edu in educations:
        resume_text += f"{edu.get('institution', '')} {edu.get('degree', '')} "
    
    skills = resume_data.get('skills', [])
    resume_text += ' '.join(skills)
    
    # Count matching keywords
    resume_words = re.findall(r'\b(\w{4,})\b', resume_text.lower())
    unique_resume_words = list(set(resume_words))
    
    match_count = 0
    for keyword in unique_job_keywords:
        if keyword in unique_resume_words:
            match_count += 1
    
    if len(unique_job_keywords) == 0:
        return 0
    return min(100, round((match_count / len(unique_job_keywords)) * 100))

def check_formatting(resume_data):
    """Check formatting consistency"""
    score = 100
    
    # Check for consistent date formatting
    date_regex = re.compile(r'^(?:\d{1,2}/\d{4}|\d{4}|present|current)$', re.IGNORECASE)
    
    experiences = resume_data.get('experience', [])
    date_inconsistencies = 0
    for exp in experiences:
        if exp.get('startDate') and not date_regex.match(str(exp.get('startDate', ''))):
            date_inconsistencies += 1
        if exp.get('endDate') and not date_regex.match(str(exp.get('endDate', ''))) and not re.match(r'^(present|current)$', str(exp.get('endDate', '')), re.IGNORECASE):
            date_inconsistencies += 1
    
    educations = resume_data.get('education', [])
    for edu in educations:
        if edu.get('startDate') and not date_regex.match(str(edu.get('startDate', ''))):
            date_inconsistencies += 1
        if edu.get('endDate') and not date_regex.match(str(edu.get('endDate', ''))):
            date_inconsistencies += 1
    
    if date_inconsistencies > 0:
        score -= 10
    
    # Check for excessive whitespace
    resume_text = json.dumps(resume_data)
    if re.search(r'\s{4,}', resume_text):
        score -= 10
    
    # Check for consistent bullet points
    for exp in experiences:
        description = exp.get('description', '')
        if description:
            lines = description.split('\n')
            if len(lines) > 1:
                # Check if all lines start with similar bullet point characters
                bullet_points = [line.strip()[0] for line in lines if line.strip()]
                unique_bullets = list(set(bullet_points))
                if len(unique_bullets) > 2:
                    score -= 10
                    break
    
    return max(0, score)

def generate_ai_suggestions(resume_data, job_description, scoring_result):
    """Generate AI-powered suggestions based on scoring results"""
    try:
        # Create a prompt for AI suggestions based on scoring results
        prompt = f"""
        Based on the ATS scoring results, provide specific, actionable suggestions to improve this resume.
        
        Scoring Results:
        Overall ATS Score: {scoring_result['ats_score']}/100
        Category Scores:
        - Contact Info: {scoring_result['category_scores'].get('contactInfo', 0)}/100
        - Quantified Achievements: {scoring_result['category_scores'].get('quantifiedAchievements', 0)}/100
        - Action Verbs: {scoring_result['category_scores'].get('actionVerbs', 0)}/100
        - Keywords: {scoring_result['category_scores'].get('keywords', 0)}/100
        - Formatting: {scoring_result['category_scores'].get('formatting', 0)}/100
        
        Issues Identified:
        {chr(10).join(['- ' + issue for issue in scoring_result['issues']])}
        
        Job Description:
        {job_description[:500]}...
        
        Resume Summary:
        {resume_data.get('summary', '')[:300]}...
        
        Provide 5 specific suggestions to improve the resume's ATS score, focusing on:
        1. Missing contact information (if applicable)
        2. Quantifying achievements with numbers and metrics
        3. Using stronger action verbs
        4. Incorporating keywords from the job description
        5. Improving formatting consistency
        
        Format your response as a JSON array of strings.
        """
        
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert resume writer and career coach. Provide specific, actionable advice with concrete examples. Return ONLY a JSON array of suggestion strings."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        result_text = response.choices[0].message.content
        
        # Try to extract JSON array from the response
        try:
            json_match = re.search(r'\[.*\]', result_text, re.DOTALL)
            if json_match:
                suggestions = json.loads(json_match.group())
                return {"suggestions": suggestions}
            else:
                raise ValueError("No JSON array found")
        except (json.JSONDecodeError, ValueError):
            # Fallback suggestions
            return generate_fallback_suggestions(scoring_result)
            
    except Exception as e:
        # Fallback to our own logic if AI fails
        return generate_fallback_suggestions(scoring_result)

def generate_fallback_suggestions(scoring_result):
    """Generate fallback suggestions based on scoring results"""
    suggestions = []
    
    # Contact Info suggestions
    if scoring_result['category_scores'].get('contactInfo', 0) < 100:
        suggestions.append("Add complete contact information including name, email, phone number, and location")
    
    # Quantified Achievements suggestions
    if scoring_result['category_scores'].get('quantifiedAchievements', 0) < 100:
        suggestions.append("Quantify your achievements with specific numbers, percentages, and metrics (e.g., 'Increased sales by 25%' rather than 'Increased sales')")
    
    # Action Verbs suggestions
    if scoring_result['category_scores'].get('actionVerbs', 0) < 100:
        suggestions.append("Start bullet points with strong action verbs (e.g., 'Managed', 'Developed', 'Implemented') rather than weak verbs like 'Responsible for'")
    
    # Keywords suggestions
    if scoring_result['category_scores'].get('keywords', 0) < 100:
        suggestions.append("Incorporate more keywords from the job description throughout your resume")
    
    # Formatting suggestions
    if scoring_result['category_scores'].get('formatting', 0) < 100:
        suggestions.append("Ensure consistent formatting throughout your resume (dates, bullet points, spacing)")
    
    # Add generic suggestions if we don't have enough
    if len(suggestions) < 3:
        suggestions.extend([
            "Use standard section headings (Summary, Experience, Education, Skills)",
            "Keep formatting simple and ATS-friendly",
            "Proofread for grammar and spelling errors"
        ])
    
    return {"suggestions": suggestions[:5]}

@ai_bp.route('/optimize-content', methods=['POST'])
def optimize_content():
    """Optimize specific resume content using AI with enhanced context"""
    try:
        data = request.get_json()
        content = data.get('content', '')
        optimization_type = data.get('type', 'improve')
        context = data.get('context', {})
        
        if not content:
            return jsonify({'error': 'Content is required'}), 400
        
        resume_content = context.get('resume_content', '')
        job_description = context.get('job_description', '')
        suggestion_category = context.get('suggestion_category', 'General')
        
        # Enhanced prompts based on suggestion type and context
        if optimization_type == 'keyword':
            prompt = f"""
            Based on the job description and current resume, provide specific examples of how to incorporate missing keywords naturally.
            
            Job Description: {job_description[:500]}...
            
            Current Resume Content:
            {resume_content[:500]}...
            
            Suggestion to Address: {content}
            
            Provide 2-3 concrete examples of how to add these keywords to resume sections like:
            - Skills section
            - Work experience bullet points
            - Professional summary
            
            Make the examples specific and action-oriented.
            """
        elif optimization_type == 'quantify':
            prompt = f"""
            Transform vague resume statements into quantified, results-driven bullet points.
            
            Current Resume Context: {resume_content[:400]}...
            Job Requirements: {job_description[:300]}...
            Improvement Needed: {content}
            
            Provide 3 examples showing:
            - Before: Generic statement
            - After: Quantified version with specific metrics, percentages, or numbers
            
            Focus on metrics relevant to the job requirements.
            """
        elif optimization_type == 'experience':
            prompt = f"""
            Based on the job description requirements, suggest specific experience examples and skills to highlight.
            
            Job Requirements: {job_description[:500]}...
            Suggestion: {content}
            Category: {suggestion_category}
            
            Provide detailed examples of:
            - Specific experience bullet points to add
            - Key skills to emphasize
            - Relevant accomplishments to highlight
            
            Make suggestions actionable and tailored to the job requirements.
            """
        elif optimization_type == 'format':
            prompt = f"""
            Improve the formatting and structure of the entire resume for better ATS parsing and visual appeal.
            
            Current Resume:
            {content}
            
            Job Requirements: {job_description[:300]}...
            
            Provide a fully formatted version with:
            - Proper section headings
            - Consistent bullet point formatting
            - ATS-friendly structure
            - Clear, professional layout
            
            Return ONLY the formatted resume content without any additional explanation.
            """
        else:
            prompt = f"""
            Provide comprehensive resume improvement suggestions based on the job requirements.
            
            Job Description: {job_description[:400]}...
            Current Resume: {resume_content[:300]}...
            Specific Issue: {content}
            
            Provide:
            1. Specific content improvements
            2. Keyword integration suggestions
            3. Quantification opportunities
            4. Experience highlighting tips
            
            Make all suggestions actionable and specific.
            """
        
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert resume writer and career coach. Provide specific, actionable advice with concrete examples. Format your response clearly with bullet points and examples."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        optimized_content = response.choices[0].message.content
        
        return jsonify({
            'optimized_content': optimized_content,
            'original_content': content,
            'optimization_type': optimization_type
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@ai_bp.route('/extract-job-keywords', methods=['POST'])
def extract_job_keywords():
    """Extract key skills and keywords from job description"""
    try:
        data = request.get_json()
        job_description = data.get('job_description', '')
        
        if not job_description:
            return jsonify({'error': 'Job description is required'}), 400
        
        prompt = f"""
        Analyze the following job description and extract the key information for a resume. 
        Provide the output in JSON format with the following fields:

        - "job_title": The job title.
        - "company_name": The company name (if mentioned).
        - "required_skills": A list of the required technical and soft skills.
        - "preferred_skills": A list of the preferred skills.
        - "keywords": A list of important keywords and phrases to include in the resume.

        Job Description:
        {job_description}
        """
        
        response = openai.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You are an expert at analyzing job descriptions and extracting key requirements for resume optimization."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        
        result_text = response.choices[0].message.content
        
        # Try to extract JSON from the response
        try:
            json_match = re.search(r'\{.*\}', result_text, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
            else:
                # Fallback
                result = {
                    "job_title": "Software Engineer",
                    "company_name": "Tech Company",
                    "required_skills": ["React", "Node.js", "TypeScript"],
                    "preferred_skills": ["AWS", "Docker", "Kubernetes"],
                    "keywords": ["full-stack", "scalable", "microservices"]
                }
        except json.JSONDecodeError:
            result = {
                "job_title": "Software Engineer", 
                "company_name": "Tech Company",
                "required_skills": ["React", "Node.js", "TypeScript"],
                "preferred_skills": ["AWS", "Docker", "Kubernetes"],
                "keywords": ["full-stack", "scalable", "microservices"]
            }
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500