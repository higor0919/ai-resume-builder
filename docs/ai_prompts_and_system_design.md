


# AI Prompts & System Design

This document outlines the AI prompts and system design for the AI Resume Builder project. These prompts are designed to be used with the OpenAI GPT-4 API to provide the core AI functionality of the application.

## 1. AI Prompts for Resume Optimization

### 1.1. Job Description Analysis

**Goal:** Extract key skills, qualifications, and keywords from a job description.

**Prompt:**

```
Analyze the following job description and extract the key information for a resume. Provide the output in JSON format with the following fields:

- "job_title": The job title.
- "company_name": The company name.
- "required_skills": A list of the required technical and soft skills.
- "preferred_skills": A list of the preferred skills.
- "keywords": A list of important keywords and phrases to include in the resume.

Job Description:

[Paste Job Description Here]
```

### 1.2. Resume ATS Scoring

**Goal:** Score a resume against a job description and provide feedback for improvement.

**Prompt:**

```
Score the following resume against the provided job description on a scale of 1 to 100. The score should be based on how well the resume is optimized for an Applicant Tracking System (ATS). Provide the output in JSON format with the following fields:

- "ats_score": The overall ATS score (0-100).
- "missing_keywords": A list of important keywords from the job description that are missing from the resume.
- "suggestions": A list of specific suggestions for improving the resume's ATS score.

Job Description:

[Paste Job Description Here]

Resume:

[Paste Resume Text Here]
```

### 1.3. Bullet Point Optimization

**Goal:** Rewrite a resume bullet point to be more impactful and results-oriented.

**Prompt:**

```
Rewrite the following resume bullet point to be more impactful and results-oriented. Use the STAR (Situation, Task, Action, Result) method to frame the bullet point. Provide 3 different variations.

Original Bullet Point:

[Paste Bullet Point Here]
```

### 1.4. Resume Summary Generation

**Goal:** Generate a professional resume summary based on the user's experience and skills.

**Prompt:**

```
Generate a professional resume summary for a [Job Title] with the following experience and skills. The summary should be 3-4 sentences long and highlight the candidate's key qualifications.

Experience:

[Paste Experience Here]

Skills:

[Paste Skills Here]
```

### 1.5. Cover Letter Generation

**Goal:** Generate a personalized cover letter for a specific job application.

**Prompt:**

```
Generate a personalized cover letter for a [Job Title] at [Company Name]. The cover letter should be tailored to the provided job description and highlight the candidate's relevant skills and experience from their resume.

Job Description:

[Paste Job Description Here]

Resume:

[Paste Resume Text Here]
```

## 2. System Design for AI Features

### 2.1. Real-time ATS Scoring

1.  The frontend will send the user's resume and the job description to the backend every 5-10 seconds as the user types.
2.  The backend will use the "Resume ATS Scoring" prompt to get the ATS score and suggestions from the OpenAI API.
3.  The backend will return the score and suggestions to the frontend.
4.  The frontend will update the UI in real-time to display the new score and feedback.

### 2.2. "Fix with AI" Functionality

1.  When the user clicks the "Fix with AI" button for a specific suggestion, the frontend will send the relevant text and the suggestion to the backend.
2.  The backend will use the appropriate prompt (e.g., "Bullet Point Optimization") to get the improved text from the OpenAI API.
3.  The backend will return the improved text to the frontend.
4.  The frontend will display the suggested change to the user, who can then accept or reject it.

### 2.3. Competitor Analysis

1.  The backend will maintain a database of common skills and keywords for different job titles and industries.
2.  When a user analyzes a job description, the backend will compare the extracted keywords to its database to identify common patterns.
3.  The backend will return a list of skills and keywords that are likely to be on other applicants' resumes.
4.  The frontend will display this information to the user as "competitor analysis."

## 3. User Interaction Flows

### 3.1. Onboarding Flow

1.  User signs up for a free account.
2.  User is prompted to either upload a resume or start from a template.
3.  User is guided through the resume editor with a short interactive tutorial.
4.  User is encouraged to paste a job description to see the real-time ATS scoring in action.

### 3.2. Upgrade Flow

1.  When a free user hits a usage limit (e.g., tries to create a second resume), they are shown a modal with the pricing plans.
2.  The modal highlights the benefits of the paid plans, such as unlimited resumes and full ATS optimization.
3.  The user can choose a plan and enter their payment information through a Stripe-powered form.
4.  Once the payment is successful, the user's account is upgraded and they can access the premium features.


