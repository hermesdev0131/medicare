import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      prompt, 
      contentType, 
      userId, 
      courseId, 
      difficulty = 'intermediate',
      topic,
      format = 'lesson'
    } = await req.json();
    
    if (!prompt || !contentType || !userId) {
      return new Response(
        JSON.stringify({ error: 'Prompt, contentType, and userId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user learning pattern for personalization
    const { data: userPattern } = await supabase
      .rpc('get_user_learning_pattern', { user_uuid: userId });

    // Build system prompt based on content type
    let systemPrompt = '';
    let temperature = 0.7;
    let maxTokens = 2000;

    switch (contentType) {
      case 'lesson':
        systemPrompt = `You are a Medicare Insurance expert instructional designer creating comprehensive lesson content. Generate CMS-compliant, well-structured educational content that:
1. Is appropriate for ${difficulty} level insurance agents
2. Includes clear Medicare learning objectives
3. Has engaging examples from real Medicare scenarios
4. Provides practical applications for call center and field environments
5. Emphasizes CMS compliance and marketing guidelines
6. Is formatted with proper headings and structure
7. Includes relevant regulation references

User's learning preferences: ${JSON.stringify(userPattern)}
Topic: ${topic || 'Medicare Insurance Fundamentals'}
Format: Interactive Medicare lesson content with compliance focus`;
        maxTokens = 3000;
        break;

      case 'quiz':
        systemPrompt = `You are creating Medicare Insurance assessment questions for agent certification. Generate CMS-compliant multiple choice questions that:
1. Test Medicare knowledge at ${difficulty} level for insurance agents
2. Have 4 options with one clearly correct answer
3. Include detailed compliance explanations for the correct answer
4. Are relevant to Medicare topic: ${topic || 'Medicare Insurance Knowledge'}
5. Include practical scenarios from call center and field environments
6. Test understanding of CMS regulations and marketing guidelines

Return in JSON format with questions array containing: question, options, correctAnswer, explanation with CMS compliance notes.`;
        temperature = 0.5;
        maxTokens = 1500;
        break;

      case 'summary':
        systemPrompt = `You are summarizing Medicare Insurance educational content for insurance agents. Create a concise, CMS-compliant summary that:
1. Captures key Medicare concepts and compliance requirements
2. Is appropriate for ${difficulty} level insurance agents
3. Uses bullet points and clear structure
4. Highlights important compliance takeaways and best practices
5. Includes relevant CMS regulation references

Topic: ${topic || 'Medicare Insurance Overview'}
Focus: Ensure all information is current and compliant with CMS guidelines.`;
        maxTokens = 1000;
        break;

      case 'exercise':
        systemPrompt = `You are creating practical Medicare Insurance exercises for agent training. Generate compliant activities that:
1. Reinforce Medicare knowledge and compliance objectives
2. Are appropriate for ${difficulty} level insurance agents
3. Include step-by-step CMS-compliant instructions
4. Provide realistic call center and field scenarios
5. Encourage practical application of Medicare regulations
6. Include role-playing exercises for agent-client interactions

Topic: ${topic || 'Medicare Insurance Practice'}
Focus: All exercises must be CMS-compliant and include realistic agent scenarios.`;
        maxTokens = 2000;
        break;

      default:
        systemPrompt = `You are a Medicare Insurance educational content creator. Generate high-quality, CMS-compliant, engaging Medicare content based on the user's request. Focus on practical applications for insurance agents in both call center and field environments.`;
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;
    const tokensUsed = data.usage?.total_tokens || 0;

    // Save generated content to database
    const { data: savedContent, error: saveError } = await supabase
      .from('ai_generated_content')
      .insert({
        user_id: userId,
        prompt,
        content_type: contentType,
        generated_content: {
          content: generatedContent,
          metadata: {
            difficulty,
            topic,
            format,
            model: 'gpt-4o-mini',
            timestamp: new Date().toISOString()
          }
        },
        tokens_used: tokensUsed,
        model_used: 'gpt-4o-mini'
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving generated content:', saveError);
    }

    return new Response(
      JSON.stringify({
        content: generatedContent,
        tokensUsed,
        contentId: savedContent?.id,
        metadata: {
          difficulty,
          topic,
          format,
          contentType
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-content function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});