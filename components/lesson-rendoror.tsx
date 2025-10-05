'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';

// Custom hook to dynamically load the Babel script
function useBabel() {
    const [isBabelLoaded, setIsBabelLoaded] = useState(false);
    useEffect(() => {
        // Check if Babel is already on the window object
        if (window.Babel) {
            setIsBabelLoaded(true);
            return;
        }
        // If not, create and append the script tag
        const script = document.createElement('script');
        script.src = "https://unpkg.com/@babel/standalone/babel.min.js";
        script.async = true;
        script.onload = () => setIsBabelLoaded(true);
        document.body.appendChild(script);

        // Cleanup function to remove the script
        return () => {
            document.body.removeChild(script);
        }
    }, []);
    return isBabelLoaded;
}

type LessonRendererProps = {
    content: string;
};

export const LessonRenderer = ({ content }: LessonRendererProps) => {
    const isBabelLoaded = useBabel();
    const [error, setError] = useState<string | null>(null);

    // useMemo will re-calculate the component only when content or babel loading status changes
    const RenderedComponent = useMemo(() => {
        if (!isBabelLoaded || !content) {
            return null;
        }

        try {
            // Attempt to find a component declaration to make evaluation more robust
            const componentNameMatch = content.match(/(?:const|function)\s+([A-Z]\w+)\s*=\s*\(\)/);
            if (!componentNameMatch?.[1]) {
                throw new Error("Could not find a valid React component declaration in the code (e.g., 'const Lesson = () => ...').");
            }
            const componentName = componentNameMatch[1];

            // Remove imports and the default export to prepare the code for evaluation
            const codeToEval = content
                .replace(/import\s+.*\s+from\s+['"].*['"];?/g, '')
                .replace(/export\s+default\s+\w+;?/g, '');

            const finalCode = `${codeToEval}\nreturn ${componentName};`;

            const transformedCode = window.Babel.transform(finalCode, {
                presets: ['react', 'typescript'],
                filename: 'lesson.tsx'
            }).code;

            if (transformedCode) {
                // `new Function()` creates a function from a string of code.
                // We pass 'React' as an argument so the transpiled JSX (React.createElement) works.
                const lessonFunction = new Function('React', transformedCode);
                const LessonComponent = lessonFunction(React);
                setError(null); // Clear previous errors
                return LessonComponent;
            } else {
                throw new Error('Babel transformation returned empty or invalid code.');
            }
        } catch (e) {
            console.error('Error rendering lesson content:', e);
            setError(e instanceof Error ? e.message : 'An unknown error occurred during rendering.');
            return null;
        }
    }, [content, isBabelLoaded]);

    if (error) {
        return (
            <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <h3 className="font-bold text-lg">Lesson Rendering Error</h3>
                <p className="mt-2 text-sm">There was an issue trying to display this lesson. The AI-generated code might be invalid.</p>
                <pre className="mt-2 text-xs bg-red-50 p-3 rounded whitespace-pre-wrap font-mono">{error}</pre>
                <details className="mt-4 text-sm">
                    <summary className="cursor-pointer font-semibold">View Original AI Content</summary>
                    <pre className="mt-2 text-xs bg-gray-100 text-gray-800 p-3 rounded whitespace-pre-wrap font-mono"><code>{content}</code></pre>
                </details>
            </div>
        );
    }

    if (!isBabelLoaded) {
        return <div className="text-center p-8">Loading lesson renderer...</div>
    }

    // Suspense can be used here for better loading states if components are code-split
    return RenderedComponent ? <Suspense fallback={<div>Loading Lesson...</div>}>{React.createElement(RenderedComponent)}</Suspense> : <div className="text-center p-8">Loading lesson content...</div>;
};

// We need to declare Babel on the window object for TypeScript to not throw an error
declare global {
    interface Window {
        Babel: any;
    }
}
