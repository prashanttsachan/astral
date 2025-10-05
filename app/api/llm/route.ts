import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { openai } from "@ai-sdk/openai";
import * as ai from "ai";
import { wrapAISDK } from "langsmith/experimental/vercel";
import { z } from 'zod';

const lessonRequestSchema = z.object({
    lessonId: z.uuidv4(),
    outline: z.string().min(10, "Outline must be at least 10 characters long."),
});

const { generateText } = wrapAISDK(ai);

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const body = await req.json();

    const parsed = lessonRequestSchema.safeParse(body);

    if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { lessonId, outline } = parsed.data;

    try {
        console.log(`Starting generation for lesson ${lessonId}`);

        const systemPrompt = `
            You are an expert educational content creator specializing in creating interactive and engaging lessons for children using React components and Tailwind CSS.
            Your task is to generate a single TSX file for a Next.js application.

            **CRITICAL STYLING RULES:**
            1.  **High Contrast is Mandatory:** All text MUST have high contrast against its background. The lesson will be displayed on a page with a white or very light gray background.
            2.  **Avoid Light Text Colors:** To ensure readability, DO NOT use light-colored text classes like \`text-white\`, \`text-gray-100\`, \`text-slate-200\`, etc., for primary content, as they will be invisible. Use dark, legible text colors like \`text-gray-800\`, \`text-slate-900\`, or other dark shades.

            The output MUST be a valid TSX component that can be rendered directly.
            Do NOT include any markdown formatting like \`\`\`tsx or \`\`\`. Just return the raw code.
            The component should be self-contained.
            Use Tailwind CSS for styling to make the lesson visually appealing, following the contrast rules above.
            Incorporate interactive elements where appropriate (e.g., simple quizzes, clickable elements to reveal information).
            For quizzes, provide immediate feedback.
            You can use SVGs to make it more engaging.
            The main export should be a function component, preferably named 'Lesson'.

            Here is an example structure:

            import React, { useState } from 'react';

            const Lesson = () => {
            return (
                <div className="p-4 font-sans text-gray-800">
                <h1 className="text-3xl font-bold mb-4 text-indigo-700">Lesson Title</h1>
                {/* ... rest of the lesson content using dark, high-contrast text ... */}
                </div>
            );
            };

            export default Lesson;
        `;

        const result = await generateText({
            model: openai("gpt-4o-mini"),
            system: systemPrompt,
            messages: [
                { role: "user", content: `Create a lesson based on this outline: "${outline}"` }
            ]
        });

        const generatedContent = result.text;

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
        return NextResponse.json({ status: 'Success', message: 'Lesson created successfully.' }, { status: 201 });
    } catch (error) {
        console.error(`Error generating content for lesson ${lessonId}:`, error);
        const { error: updateError } = await supabase.from('lessons')
            .update({ status: 'failed', content: `// Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` })
            .eq('id', lessonId);
        if (updateError) {
            console.error(`Failed to update lesson status to 'failed' for lesson ${lessonId}:`, updateError);
        }
        return NextResponse.json({ status: 'Failed', message: 'Unable to create lesson for now' }, { status: 500 });
    }
}


// import { createClient } from '@/lib/supabase/server';
// import { NextRequest, NextResponse } from 'next/server';
// import { OpenAI } from "openai";
// import { z } from 'zod';

// const openai = new OpenAI({
//     apiKey: process.env.NEXT_OPENAI_API_KEY,
// });

// const lessonRequestSchema = z.object({
//     lessonId: z.uuidv4(),
//     outline: z.string().min(10, "Outline must be at least 10 characters long."),
// });

// export async function POST(req: NextRequest) {
//     const supabase = await createClient();
//     const body = await req.json();

//     const parsed = lessonRequestSchema.safeParse(body);

//     if (!parsed.success) {
//         return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
//     }

//     const { lessonId, outline } = parsed.data;

//     try {
//         console.log(`Starting generation for lesson ${lessonId}`);

//         const systemPrompt = `
//             You are an expert educational content creator specializing in creating interactive and engaging lessons for children using React components and Tailwind CSS.
//             Your task is to generate a single TSX file for a Next.js application.

//             **CRITICAL STYLING RULES:**
//             1.  **High Contrast is Mandatory:** All text MUST have high contrast against its background. The lesson will be displayed on a page with a white or very light gray background.
//             2.  **Avoid Light Text Colors:** To ensure readability, DO NOT use light-colored text classes like \`text-white\`, \`text-gray-100\`, \`text-slate-200\`, etc., for primary content, as they will be invisible. Use dark, legible text colors like \`text-gray-800\`, \`text-slate-900\`, or other dark shades.

//             The output MUST be a valid TSX component that can be rendered directly.
//             Do NOT include any markdown formatting like \`\`\`tsx or \`\`\`. Just return the raw code.
//             The component should be self-contained.
//             Use Tailwind CSS for styling to make the lesson visually appealing, following the contrast rules above.
//             Incorporate interactive elements where appropriate (e.g., simple quizzes, clickable elements to reveal information).
//             For quizzes, provide immediate feedback.
//             You can use SVGs to make it more engaging.
//             The main export should be a function component, preferably named 'Lesson'.

//             Here is an example structure:

//             import React, { useState } from 'react';

//             const Lesson = () => {
//             return (
//                 <div className="p-4 font-sans text-gray-800">
//                 <h1 className="text-3xl font-bold mb-4 text-indigo-700">Lesson Title</h1>
//                 {/* ... rest of the lesson content using dark, high-contrast text ... */}
//                 </div>
//             );
//             };

//             export default Lesson;
//         `;

//         const completion = await openai.chat.completions.create({
//             model: "gpt-4-turbo",
//             messages: [
//                 { role: "system", content: systemPrompt },
//                 { role: "user", content: `Create a lesson based on this outline: "${outline}"` }
//             ]
//         });

//         const generatedContent = completion.choices[0].message.content;

//         if (!generatedContent) {
//             throw new Error("AI failed to generate content.");
//         }

//         const titleMatch = generatedContent.match(/<h1[^>]*>([^<]+)<\/h1>/);
//         const title = titleMatch ? titleMatch[1] : `Lesson for: "${outline.substring(0, 20)}..."`;

//         const { error: updateError } = await supabase
//             .from('lessons')
//             .update({ content: generatedContent, status: 'generated', title: title })
//             .eq('id', lessonId);

//         if (updateError) {
//             throw new Error(`Failed to update lesson in DB: ${updateError.message}`);
//         }
//         console.log(`Successfully generated and saved content for lesson ${lessonId}`);
//         return NextResponse.json({ status: 'Success', message: 'Lesson created successfully.' }, { status: 201 });
//     } catch (error) {
//         console.error(`Error generating content for lesson ${lessonId}:`, error);
//         const { error: updateError } = await supabase.from('lessons')
//             .update({ status: 'failed', content: `// Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` })
//             .eq('id', lessonId);
//         if (updateError) {
//             console.error(`Failed to update lesson status to 'failed' for lesson ${lessonId}:`, updateError);
//         }
//         return NextResponse.json({ status: 'Failed', message: 'Unable to create lesson for now' }, { status: 500 });
//     }
// }