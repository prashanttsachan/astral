import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from "openai";
import { z } from 'zod';

const openai = new OpenAI({
    apiKey: process.env.NEXT_OPENAI_API_KEY,
});

const lessonRequestSchema = z.object({
    outline: z.string().min(10, "Outline must be at least 10 characters long."),
});

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const body = await req.json();

    const parsed = lessonRequestSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { outline } = parsed.data;

    const { data: lesson, error: insertError } = await supabase
        .from('lessons')
        .insert({
            outline,
            title: `Lesson based on: "${outline.substring(0, 30)}..."`,
            status: 'generating',
            content: '/* Generating content... */',
        })
        .select()
        .single();

    if (insertError) {
        console.error('Error creating lesson:', insertError);
        return NextResponse.json({ error: 'Failed to create lesson.' }, { status: 500 });
    }

    generateLessonContent(lesson.id, outline);
    return NextResponse.json(lesson, { status: 201 });
}


async function generateLessonContent(lessonId: string, outline: string) {
    const supabase = await createClient();
    try {
        console.log(`Starting generation for lesson ${lessonId}`);

        const systemPrompt = `
            You are an expert educational content creator specializing in creating interactive and engaging lessons for children using React components and Tailwind CSS.
            Your task is to generate a single TSX file for a Next.js application.
            The output MUST be a valid TSX component that can be rendered directly.
            Do NOT include any markdown formatting like \`\`\`tsx or \`\`\`. Just return the raw code.
            The component should be self-contained.
            Use Tailwind CSS for styling to make the lesson visually appealing and easy to read.
            Incorporate interactive elements where appropriate (e.g., simple quizzes, clickable elements to reveal information).
            For quizzes, provide immediate feedback.
            You can use SVGs to make it more engaging.
            The main export should be a function component named 'Lesson'.
            Here is an example structure:

            import React from 'react';

            const Lesson = () => {
            return (
                <div className="p-4 font-sans">
                <h1 className="text-3xl font-bold mb-4 text-indigo-700">Lesson Title</h1>
                {/* ... rest of the lesson content ... */}
                </div>
            );
            };

            export default Lesson;
        `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Create a lesson based on this outline: "${outline}"` }
            ]
        });

        const generatedContent = completion.choices[0].message.content;

        if (!generatedContent) {
            throw new Error("AI failed to generate content.");
        }

        const titleMatch = generatedContent.match(/<h1[^>]*>([^<]+)<\/h1>/);
        const title = titleMatch ? titleMatch[1] : `Lesson for: "${outline.substring(0, 20)}..."`;

        const { error: updateError } = await supabase
            .from('lessons')
            .update({ content: generatedContent, status: 'generated', title: title })
            .eq('id', lessonId);

        if (updateError) {
            throw new Error(`Failed to update lesson in DB: ${updateError.message}`);
        }
        console.log(`Successfully generated and saved content for lesson ${lessonId}`);

    } catch (error) {
        console.error(`Error generating content for lesson ${lessonId}:`, error);
        const { error: updateError } = await supabase.from('lessons')
            .update({ status: 'failed', content: `// Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` })
            .eq('id', lessonId);
        if (updateError) {
            console.error(`Failed to update lesson status to 'failed' for lesson ${lessonId}:`, updateError);
        }
    }
}
