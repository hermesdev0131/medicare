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
    const { question, lessonId, courseId, userId, context } = await req.json();
    
    if (!question || !userId) {
      return new Response(
        JSON.stringify({ error: 'Question and userId are required' }),
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

    // Get lesson context if lessonId is provided
    let lessonContext = '';
    if (lessonId) {
      const { data: lesson } = await supabase
        .from('course_lessons')
        .select('title, description, content_text, lesson_type')
        .eq('id', lessonId)
        .single();
      
      if (lesson) {
        lessonContext = `Current lesson: ${lesson.title}\nDescription: ${lesson.description}\nContent: ${lesson.content_text || 'No text content available'}\nType: ${lesson.lesson_type}`;
      }
    }

    // Get user's learning pattern for personalization
    const { data: userPattern } = await supabase
      .rpc('get_user_learning_pattern', { user_uuid: userId });

    const systemPrompt = `You are a Medicare Insurance AI tutor specializing in helping insurance agents learn about Medicare, compliance, and marketing guidelines. Your role is to:

1. Answer Medicare-related questions clearly and accurately
2. Provide compliant explanations that follow CMS guidelines
3. Reference current Medicare regulations and marketing rules
4. Help agents understand complex Medicare concepts for both call center and field environments
5. Encourage compliant sales practices and continuing education

Your expertise covers:
- Medicare Part A (Hospital Insurance), Part B (Medical Insurance), Part C (Medicare Advantage), Part D (Prescription Drug Coverage)
- Medicare Supplement (Medigap) plans and regulations
- CMS compliance and marketing guidelines
- VA Benefits, CHAMPVA, and TRICARE for Life coordination with Medicare
- Indian Health Service (IHS) benefits coordination
- Insurance licensing requirements and maintenance
- Dual eligibility (Medicare-Medicaid) coordination
- Medicare enrollment periods (AEP, OEP, SEP)
- Call center and field sales best practices

User's learning pattern: ${JSON.stringify(userPattern)}
${lessonContext}

Additional context: ${context || 'Medicare Insurance Training'}

Always emphasize compliance when relevant. Respond in a helpful, encouraging tone while maintaining regulatory accuracy. Keep answers concise but thorough, and include practical examples for insurance agents.`;

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
          { role: 'user', content: question }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    // Generate follow-up questions
    const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Generate 2-3 Medicare-focused follow-up questions based on the conversation to help the insurance agent deepen their Medicare knowledge and compliance understanding. Include practical application questions for call center or field environments. Return as a JSON array of strings.' 
          },
          { role: 'user', content: `Original question: ${question}\nAI response: ${aiResponse}` }
        ],
        temperature: 0.8,
        max_tokens: 200,
      }),
    });

    let followUpQuestions = [];
    if (followUpResponse.ok) {
      const followUpData = await followUpResponse.json();
      try {
        followUpQuestions = JSON.parse(followUpData.choices[0].message.content);
      } catch (e) {
        console.error('Error parsing follow-up questions:', e);
      }
    }

    // Save tutoring session to database
    const { error: saveError } = await supabase
      .from('ai_tutoring_sessions')
      .insert({
        user_id: userId,
        lesson_id: lessonId,
        question,
        ai_response: {
          content: aiResponse,
          model: 'gpt-4o-mini',
          timestamp: new Date().toISOString()
        },
        follow_up_questions: followUpQuestions,
        session_duration_seconds: 0 // Will be updated on rating
      });

    if (saveError) {
      console.error('Error saving tutoring session:', saveError);
    }

    return new Response(
      JSON.stringify({
        response: aiResponse,
        followUpQuestions,
        sessionId: null // Could return the inserted session ID if needed
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-tutor function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});