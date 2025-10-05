import Link from 'next/link';

export type Lesson = {
    id: string;
    created_at: string;
    title: string | null;
    outline: string | null;
    content: string | null;
    status: string | null;
};

type LessonsTableProps = {
    lessons: Lesson[];
};

export function LessonsTable({ lessons }: LessonsTableProps) {
    if (lessons.length === 0) {
        return <p className="text-center text-gray-500 py-8">No lessons generated yet. Create one to get started!</p>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Title
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Created
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {lessons.map((lesson) => (
                        <tr key={lesson.id} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {lesson.status === 'generated' ? (
                                    <Link href={`/lessons/${lesson.id}`} className="text-indigo-600 hover:text-indigo-900 hover:underline">
                                        {lesson.title || 'Untitled Lesson'}
                                    </Link>
                                ) : (
                                    lesson.title || 'Untitled Lesson'
                                )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${lesson.status === 'generating' ? 'bg-yellow-100 text-yellow-800 animate-pulse' :
                                    lesson.status === 'generated' ? 'bg-green-100 text-green-800' :
                                        lesson.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                    {lesson.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(lesson.created_at).toDateString()}, {new Date(lesson.created_at).toTimeString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
