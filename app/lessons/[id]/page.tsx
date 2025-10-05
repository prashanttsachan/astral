import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { LessonRenderer } from '@/components/lesson-rendoror';

type PageProps = {
    params: Promise<{ id: string }>;
};

export default async function LessonPage({ params }: PageProps) {
    const supabase = await createClient();
    const id = (await params).id;

    const { data: lesson, error } = await supabase
        .from('lessons')
        .select('id, title, content, outline')
        .eq('id', id)
        .single();

    if (error || !lesson) {
        console.error('Error fetching lesson:', error);
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-800">
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{lesson.title}</h1>
                        <p className="text-sm text-gray-500 mt-1">Lesson Outline: &quot;{lesson.outline}&quot;</p>
                    </div>
                    <Link href="/" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        &larr; Back to Lessons
                    </Link>
                </div>
            </header>

            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md">
                    <LessonRenderer content={lesson.content || ''} />
                </div>
            </main>

            <footer className="bg-white mt-12 py-6 border-t">
                <div className="container mx-auto px-4 text-center text-gray-500">
                    <p>&copy; {new Date().getFullYear()} Astral Digital Lessons. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}

