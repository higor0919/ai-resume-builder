// ATS Scoring Logic Utility

// 5 Check Categories with their weightings
const SCORING_CATEGORIES = {
  contactInfo: { weight: 10, name: "Contact Information" },
  quantifiedAchievements: { weight: 25, name: "Quantified Achievements" },
  actionVerbs: { weight: 15, name: "Action Verbs" },
  keywords: { weight: 30, name: "Keywords Match" },
  formatting: { weight: 20, name: "Formatting" }
};

// Lists of strong action verbs
const ACTION_VERBS = [
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
];

// Function to calculate ATS score based on resume content and job description
export const calculateATSScore = (resumeData, jobDescription) => {
  let totalScore = 0;
  const categoryScores = {};
  const issues = [];

  // 1. Contact Information Check (10%)
  const contactScore = checkContactInfo(resumeData);
  categoryScores.contactInfo = contactScore;
  totalScore += contactScore * SCORING_CATEGORIES.contactInfo.weight / 100;
  if (contactScore < 100) {
    issues.push("Missing complete contact information (name, email, phone)");
  }

  // 2. Quantified Achievements Check (25%)
  const quantifiedScore = checkQuantifiedAchievements(resumeData);
  categoryScores.quantifiedAchievements = quantifiedScore;
  totalScore += quantifiedScore * SCORING_CATEGORIES.quantifiedAchievements.weight / 100;
  if (quantifiedScore < 100) {
    issues.push("Lack of quantified achievements with numbers and metrics");
  }

  // 3. Action Verbs Check (15%)
  const actionVerbsScore = checkActionVerbs(resumeData);
  categoryScores.actionVerbs = actionVerbsScore;
  totalScore += actionVerbsScore * SCORING_CATEGORIES.actionVerbs.weight / 100;
  if (actionVerbsScore < 100) {
    issues.push("Insufficient use of strong action verbs at the beginning of bullet points");
  }

  // 4. Keywords Match Check (30%)
  const keywordsScore = checkKeywordsMatch(resumeData, jobDescription);
  categoryScores.keywords = keywordsScore;
  totalScore += keywordsScore * SCORING_CATEGORIES.keywords.weight / 100;
  if (keywordsScore < 100) {
    issues.push("Missing important keywords from the job description");
  }

  // 5. Formatting Check (20%)
  const formattingScore = checkFormatting(resumeData);
  categoryScores.formatting = formattingScore;
  totalScore += formattingScore * SCORING_CATEGORIES.formatting.weight / 100;
  if (formattingScore < 100) {
    issues.push("Inconsistent formatting or poor structure that may confuse ATS systems");
  }

  // Round to nearest integer
  const finalScore = Math.round(totalScore);
  
  return {
    ats_score: finalScore,
    category_scores: categoryScores,
    issues: issues
  };
};

// Check contact information completeness
const checkContactInfo = (resumeData) => {
  if (!resumeData.contact) return 0;
  
  const contact = resumeData.contact;
  let score = 0;
  
  if (contact.name) score += 25;
  if (contact.email && contact.email.includes("@")) score += 25;
  if (contact.phone) score += 25;
  if (contact.location) score += 25;
  
  return score;
};

// Check for quantified achievements
const checkQuantifiedAchievements = (resumeData) => {
  let quantifiedCount = 0;
  let totalCount = 0;
  
  // Check experience section
  if (resumeData.experience && resumeData.experience.length > 0) {
    resumeData.experience.forEach(exp => {
      if (exp.description) {
        const sentences = exp.description.split(/[.!?]+/);
        sentences.forEach(sentence => {
          if (sentence.trim()) {
            totalCount++;
            // Check for numbers, percentages, currency, etc.
            if (/\d+(?:\.\d+)?\s*(?:%|percent|dollars?|\$|k|million|billion|hours?|days?|weeks?|months?|years?|employees?|projects?|clients?|sales?|revenue|growth|increase|decrease|improvement)/i.test(sentence)) {
              quantifiedCount++;
            }
          }
        });
      }
    });
  }
  
  // Also check summary for quantified statements
  if (resumeData.summary) {
    const sentences = resumeData.summary.split(/[.!?]+/);
    sentences.forEach(sentence => {
      if (sentence.trim()) {
        totalCount++;
        if (/\d+(?:\.\d+)?\s*(?:%|percent|dollars?|\$|k|million|billion|hours?|days?|weeks?|months?|years?|employees?|projects?|clients?|sales?|revenue|growth|increase|decrease|improvement)/i.test(sentence)) {
          quantifiedCount++;
        }
      }
    });
  }
  
  if (totalCount === 0) return 0;
  return Math.min(100, Math.round((quantifiedCount / totalCount) * 100));
};

// Check for action verbs usage
const checkActionVerbs = (resumeData) => {
  let actionVerbCount = 0;
  let bulletPointCount = 0;
  
  // Check experience section
  if (resumeData.experience && resumeData.experience.length > 0) {
    resumeData.experience.forEach(exp => {
      if (exp.description) {
        // Split by bullet points or sentences
        const lines = exp.description.split(/\n|\. |\? |\! /);
        lines.forEach(line => {
          const trimmedLine = line.trim();
          if (trimmedLine) {
            bulletPointCount++;
            // Extract first word
            const firstWord = trimmedLine.split(/\s+/)[0].toLowerCase().replace(/[^\w]/g, '');
            if (ACTION_VERBS.includes(firstWord)) {
              actionVerbCount++;
            }
          }
        });
      }
    });
  }
  
  // Also check summary
  if (resumeData.summary) {
    const lines = resumeData.summary.split(/\n|\. |\? |\! /);
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        bulletPointCount++;
        const firstWord = trimmedLine.split(/\s+/)[0].toLowerCase().replace(/[^\w]/g, '');
        if (ACTION_VERBS.includes(firstWord)) {
          actionVerbCount++;
        }
      }
    });
  }
  
  if (bulletPointCount === 0) return 0;
  return Math.min(100, Math.round((actionVerbCount / bulletPointCount) * 100));
};

// Check keywords match with job description
const checkKeywordsMatch = (resumeData, jobDescription) => {
  if (!jobDescription) return 0;
  
  // Extract keywords from job description (simplified approach)
  const jobKeywords = jobDescription.match(/\b(\w{4,})\b/g) || [];
  const uniqueJobKeywords = [...new Set(jobKeywords.map(k => k.toLowerCase()))];
  
  // Create resume text content
  let resumeText = "";
  if (resumeData.contact) {
    resumeText += `${resumeData.contact.name || ""} ${resumeData.contact.email || ""} ${resumeData.contact.phone || ""} `;
  }
  resumeText += `${resumeData.summary || ""} `;
  
  if (resumeData.experience) {
    resumeData.experience.forEach(exp => {
      resumeText += `${exp.company || ""} ${exp.position || ""} ${exp.description || ""} `;
    });
  }
  
  if (resumeData.education) {
    resumeData.education.forEach(edu => {
      resumeText += `${edu.institution || ""} ${edu.degree || ""} `;
    });
  }
  
  if (resumeData.skills) {
    resumeText += resumeData.skills.join(" ");
  }
  
  // Count matching keywords
  const resumeWords = resumeText.toLowerCase().match(/\b(\w{4,})\b/g) || [];
  const uniqueResumeWords = [...new Set(resumeWords)];
  
  let matchCount = 0;
  uniqueJobKeywords.forEach(keyword => {
    if (uniqueResumeWords.includes(keyword)) {
      matchCount++;
    }
  });
  
  if (uniqueJobKeywords.length === 0) return 0;
  return Math.min(100, Math.round((matchCount / uniqueJobKeywords.length) * 100));
};

// Check formatting consistency
const checkFormatting = (resumeData) => {
  let score = 100;
  const issues = [];
  
  // Check for consistent date formatting
  const dateRegex = /^(?:\d{1,2}\/\d{4}|\d{4}|present|current)$/i;
  
  if (resumeData.experience) {
    let dateInconsistencies = 0;
    resumeData.experience.forEach(exp => {
      if (exp.startDate && !dateRegex.test(exp.startDate)) dateInconsistencies++;
      if (exp.endDate && !dateRegex.test(exp.endDate) && !/^(present|current)$/i.test(exp.endDate)) dateInconsistencies++;
    });
    
    if (dateInconsistencies > 0) {
      score -= 10;
      issues.push("Inconsistent date formatting in experience section");
    }
  }
  
  if (resumeData.education) {
    let dateInconsistencies = 0;
    resumeData.education.forEach(edu => {
      if (edu.startDate && !dateRegex.test(edu.startDate)) dateInconsistencies++;
      if (edu.endDate && !dateRegex.test(edu.endDate)) dateInconsistencies++;
    });
    
    if (dateInconsistencies > 0) {
      score -= 10;
      issues.push("Inconsistent date formatting in education section");
    }
  }
  
  // Check for excessive whitespace or formatting issues
  let resumeText = JSON.stringify(resumeData);
  if (/\s{4,}/.test(resumeText)) {
    score -= 10;
    issues.push("Excessive whitespace detected");
  }
  
  // Check for consistent bullet points
  if (resumeData.experience) {
    let bulletInconsistencies = 0;
    resumeData.experience.forEach(exp => {
      if (exp.description) {
        const lines = exp.description.split('\n');
        if (lines.length > 1) {
          // Check if all lines start with similar bullet point characters
          const bulletPoints = lines.filter(line => line.trim()).map(line => line.trim()[0]);
          const uniqueBullets = [...new Set(bulletPoints)];
          if (uniqueBullets.length > 2) {
            bulletInconsistencies++;
          }
        }
      }
    });
    
    if (bulletInconsistencies > 0) {
      score -= 10;
      issues.push("Inconsistent bullet point formatting");
    }
  }
  
  return Math.max(0, score);
};

// Generate specific suggestions based on scoring results
export const generateSuggestions = (scoringResults, resumeData, jobDescription) => {
  const suggestions = [];
  
  // Contact Info suggestions
  if (scoringResults.category_scores.contactInfo < 100) {
    suggestions.push("Add complete contact information including name, email, phone number, and location");
  }
  
  // Quantified Achievements suggestions
  if (scoringResults.category_scores.quantifiedAchievements < 100) {
    suggestions.push("Quantify your achievements with specific numbers, percentages, and metrics (e.g., 'Increased sales by 25%' rather than 'Increased sales')");
  }
  
  // Action Verbs suggestions
  if (scoringResults.category_scores.actionVerbs < 100) {
    suggestions.push("Start bullet points with strong action verbs (e.g., 'Managed', 'Developed', 'Implemented') rather than weak verbs like 'Responsible for'");
  }
  
  // Keywords suggestions
  if (scoringResults.category_scores.keywords < 100) {
    // Extract some keywords from job description for suggestions
    const jobKeywords = jobDescription.match(/\b(\w{4,})\b/g) || [];
    const uniqueJobKeywords = [...new Set(jobKeywords.map(k => k.toLowerCase()))];
    
    // Suggest first 3 missing keywords
    const resumeText = JSON.stringify(resumeData).toLowerCase();
    const missingKeywords = uniqueJobKeywords.filter(keyword => 
      !resumeText.includes(keyword) && keyword.length > 3
    ).slice(0, 3);
    
    if (missingKeywords.length > 0) {
      suggestions.push(`Add these keywords from the job description: ${missingKeywords.join(', ')}`);
    } else {
      suggestions.push("Incorporate more keywords from the job description throughout your resume");
    }
  }
  
  // Formatting suggestions
  if (scoringResults.category_scores.formatting < 100) {
    suggestions.push("Ensure consistent formatting throughout your resume (dates, bullet points, spacing)");
  }
  
  return suggestions;
};