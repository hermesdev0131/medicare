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
    const { userId, goals = [], timeAvailable = 'moderate', preferences = {} } = await req.json();
    
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

    // Get user's current progress and enrolled courses
    const { data: enrollments } = await supabase
      .from('course_enrollments')
      .select(`
        *,
        courses!inner(id, title, category, difficulty_level, estimated_duration_hours)
      `)
      .eq('user_id', userId);

    // Get available courses
    const { data: availableCourses } = await supabase
      .from('courses')
      .select('*')
      .eq('is_published', true);

    // Get user's learning goals
    const { data: learningGoals } = await supabase
      .from('learning_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active');

    // Get user learning pattern
    const { data: userPattern } = await supabase
      .rpc('get_user_learning_pattern', { user_uuid: userId });

    // Prepare context for AI
    const planningContext = {
      userGoals: goals,
      timeAvailable, // 'light', 'moderate', 'intensive'
      preferences,
      currentEnrollments: enrollments || [],
      availableCourses: availableCourses || [],
      existingGoals: learningGoals || [],
      learningPattern: userPattern
    };

    // Generate study plan with AI
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
            content: `You are a Medicare Insurance learning advisor that creates personalized study plans for insurance agents. Based on the user's data, create a comprehensive Medicare-focused learning plan.

            Consider:
            - User's current Medicare knowledge and compliance training progress
            - Available time commitment (light: 2-3h/week, moderate: 5-7h/week, intensive: 10+h/week)
            - Medicare licensing requirements and continuing education needs
            - Call center vs field sales environment requirements
            - Skill progression from basic Medicare concepts to advanced compliance
            - Learning pattern analysis focused on Medicare topics

            Return a JSON response with this structure:
            {
              "title": "Study Plan Title",
              "description": "Brief description of the plan",
              "duration_weeks": number,
              "estimated_hours_per_week": number,
              "difficulty_level": "beginner|intermediate|advanced",
              "phases": [
                {
                  "phase_number": 1,
                  "title": "Phase Title",
                  "description": "Phase description",
                  "duration_weeks": number,
                  "courses": [
                    {
                      "course_id": "course-id",
                      "order": number,
                      "reason": "Why this course is included"
                    }
                  ],
                  "milestones": ["milestone1", "milestone2"]
                }
              ],
              "learning_objectives": ["objective1", "objective2"],
              "success_metrics": ["metric1", "metric2"]
            }`
          },
          {
            role: 'user',
            content: `Create a study plan for this user: ${JSON.stringify(planningContext)}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    let studyPlan;
    
    try {
      studyPlan = JSON.parse(data.choices[0].message.content);
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse study plan from AI response');
    }

    // Save the study plan to learning_goals table
    const { data: savedGoal, error: saveError } = await supabase
      .from('learning_goals')
      .insert({
        user_id: userId,
        title: studyPlan.title,
        description: studyPlan.description,
        target_completion_date: new Date(Date.now() + (studyPlan.duration_weeks * 7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        associated_courses: studyPlan.phases?.flatMap(phase => 
          phase.courses?.map(c => c.course_id) || []
        ) || [],
        status: 'active',
        progress_percentage: 0
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving study plan:', saveError);
    }

    // Create learning recommendations for suggested courses
    if (studyPlan.phases) {
      for (const phase of studyPlan.phases) {
        if (phase.courses) {
          for (const course of phase.courses) {
            try {
              await supabase
                .from('learning_recommendations')
                .insert({
                  user_id: userId,
                  recommendation_type: 'course_suggestion',
                  course_id: course.course_id,
                  content: {
                    title: `Recommended: Course in ${phase.title}`,
                    description: course.reason,
                    phase: phase.phase_number,
                    plan_id: savedGoal?.id
                  },
                  confidence_score: 0.85,
                  expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                });
            } catch (recError) {
              console.error('Error creating recommendation:', recError);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        studyPlan,
        goalId: savedGoal?.id,
        message: 'Study plan created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error generating study plan:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});