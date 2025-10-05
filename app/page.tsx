import { createClient } from "@/lib/supabase/client";
import { LessonGenerator } from '@/components/lesson-generator';
import { RealtimeLessons } from '@/components/realtime-lesson';

export default async function HomePage() {

	const supabase = createClient();

	const { data: lessons, error } = await supabase
		.from('lessons')
		.select('*')
		.order('created_at', { ascending: false });

	if (error) {
		console.error('Error fetching lessons:', error);
		// Handle error appropriately
	}

	const initialLessons = lessons ?? [];

	return (
		<div className="min-h-screen bg-gray-50 text-gray-800">
			<header className="bg-white shadow-sm">
				<div className="container mx-auto px-4 py-6">
					<h1 className="text-3xl font-bold text-gray-900">Astral Digital Lessons</h1>
					<p className="mt-1 text-gray-600">Create engaging lessons with the power of AI.</p>
				</div>
			</header>

			<main className="container mx-auto p-4 sm:p-6 lg:p-8">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className="lg:col-span-1">
						<LessonGenerator />
					</div>
					<div className="lg:col-span-2">
						<div className="bg-white p-6 rounded-lg shadow-md">
							<h2 className="text-2xl font-semibold mb-4 text-gray-800">Generated Lessons</h2>
							<RealtimeLessons serverLessons={initialLessons} />
						</div>
					</div>
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
