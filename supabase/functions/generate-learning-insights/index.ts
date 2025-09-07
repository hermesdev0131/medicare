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
    const { userId, currentCourseId } = await req.json();
    
    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
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

    // Get user's learning data
    const { data: learningData } = await supabase
      .from('lesson_progress')
      .select(`
        *,
        course_lessons!inner(title, lesson_type, estimated_duration_minutes),
        courses!inner(title, category, difficulty_level)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Get user achievements
    const { data: achievements } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);

    // Get assessment performance
    const { data: assessmentData } = await supabase
      .from('user_assessment_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Get user learning pattern
    const { data: userPattern } = await supabase
      .rpc('get_user_learning_pattern', { user_uuid: userId });

    // Prepare data for AI analysis
    const analysisData = {
      learningProgress: learningData || [],
      achievements: achievements || [],
      assessmentPerformance: assessmentData || [],
      learningPattern: userPattern,
      totalLessonsCompleted: learningData?.filter(l => l.completed).length || 0,
      averageScore: assessmentData?.reduce((acc, a) => acc + (a.score || 0), 0) / (assessmentData?.length || 1),
      currentCourseId
    };

    // Call OpenAI to generate insights
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: `You are a Medicare Insurance learning analytics expert specializing in agent development. Analyze the user's learning data and provide Medicare-specific insights, study plan recommendations, and predictions focused on Medicare insurance knowledge, compliance, and sales performance. Return a JSON response with the following structure:
            {
              "insights": [
                {
                  "type": "strength|weakness|recommendation|prediction",
                  "title": "Brief title",
                  "description": "Detailed description",
                  "actionable": boolean,
                  "priority": "low|medium|high"
                }
              ],
              "studyPlans": [
                {
                  "id": "generated-id",
                  "title": "Plan title",
                  "description": "Plan description",
                  "estimatedDuration": number_in_hours,
                  "difficulty": "beginner|intermediate|advanced",
                  "courses": [],
                  "progress": percentage
                }
              ]
            }`
          },
          {
            role: 'user',
            content: `Analyze this learning data: ${JSON.stringify(analysisData)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    let insights;
    
    try {
      insights = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      // Fallback if JSON parsing fails
      insights = {
        insights: [
          {
            type: 'recommendation',
            title: 'Keep Learning!',
            description: 'Continue with your current learning path to build stronger foundations.',
            actionable: true,
            priority: 'medium'
          }
        ],
        studyPlans: []
      };
    }

    // Save insights to database for future reference
    try {
      await supabase
        .from('learning_predictions')
        .insert({
          user_id: userId,
          prediction_type: 'learning_insights',
          target_type: 'user_performance',
          prediction_data: insights,
          created_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        });
    } catch (dbError) {
      console.error('Error saving insights to database:', dbError);
    }

    return new Response(
      JSON.stringify(insights),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating learning insights:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});