import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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

    return NextResponse.json(lesson, { status: 201 });
}