'use client';

import { useState } from 'react';

export function LessonGenerator() {
    const [outline, setOutline] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!outline.trim()) {
            setError('Please enter a lesson outline.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setSuccess(null);
        try {
            const response = await fetch('/api/lesson', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ outline }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                // Extract Zod error message if available
                const errorMessage = errorData.error?.outline?._errors[0] || 'Failed to start lesson generation.';
                throw new Error(errorMessage);
            }
            setSuccess('Lesson generation started! It will appear in the list shortly.');
            setOutline('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md sticky top-8">
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Generate a New Lesson</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="outline" className="block text-sm font-medium text-gray-700 mb-2">
                        Lesson Outline
                    </label>
                    <textarea
                        id="outline"
                        name="outline"
                        rows={4}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
                        placeholder="e.g., A 10 question pop quiz on Florida"
                        value={outline}
                        onChange={(e) => setOutline(e.target.value)}
                        disabled={isLoading}
                    />
                </div>

                {error && <p className="text-sm text-red-600 mb-4 p-3 bg-red-50 rounded-md">{error}</p>}
                {success && <p className="text-sm text-green-600 mb-4 p-3 bg-green-50 rounded-md">{success}</p>}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                >
                    {isLoading ? (
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : 'Generate Lesson'}
                </button>
            </form>
        </div>
    );
}
