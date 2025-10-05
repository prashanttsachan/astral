'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';

// Custom hook to dynamically load the Babel script
function useBabel() {
    const [isBabelLoaded, setIsBabelLoaded] = useState(false);
    useEffect(() => {
        if (window.Babel) {
            setIsBabelLoaded(true);
            return;
        }
        const script = document.createElement('script');
        script.src = "https://unpkg.com/@babel/standalone/babel.min.js";
        script.async = true;
        script.onload = () => setIsBabelLoaded(true);
        document.body.appendChild(script);

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

    const RenderedComponent = useMemo(() => {
        if (!isBabelLoaded || !content) {
            return null;
        }

        try {
            // Step 1: Sanitize the code by removing imports.
            let code = content.replace(/import\s+.*\s+from\s+['"].*['"];?/g, '');
            let componentName = '';

            // Step 2: Identify the exported component. Handle both named and anonymous default exports.
            const namedExportMatch = code.match(/export\s+default\s+([A-Za-z0-9_]+);?/);
            if (namedExportMatch) {
                componentName = namedExportMatch[1];
                // Remove the export line to avoid it being in the transformed code
                code = code.replace(/export\s+default\s+[A-Za-z0-9_]+;?/, '');
            } else if (code.includes('export default')) {
                // Handle anonymous exports, e.g., "export default () => ..."
                componentName = 'LessonComponent'; // Assign a consistent name
                code = code.replace(/export\s+default/, `const ${componentName} =`);
            } else {
                throw new Error("Could not find a 'default export' in the AI-generated code.");
            }

            // Step 3: Transform only the component's source code with Babel.
            // This is now a valid script (e.g., just function/const declarations).
            const transformedCode = window.Babel.transform(code, {
                presets: ['react', 'typescript'],
                filename: 'lesson.tsx'
            }).code;

            if (!transformedCode) {
                throw new Error('Babel transformation resulted in empty code.');
            }

            // Step 4: Create the full function body for `new Function`.
            // This body will contain the transformed code AND the return statement.
            const functionBody = `${transformedCode}\nreturn ${componentName};`;

            // Step 5: Create the component function, injecting React and its hooks into the scope.
            // This makes `useState`, `useEffect`, etc., available directly in the AI code.
            const scope = { React, useState: React.useState, useEffect: React.useEffect, useMemo: React.useMemo, useCallback: React.useCallback, useRef: React.useRef };
            const scopeKeys = Object.keys(scope);
            const scopeValues = Object.values(scope);

            const lessonFunction = new Function(...scopeKeys, functionBody);
            const LessonComponent = lessonFunction(...scopeValues);

            setError(null); // Clear previous errors
            return LessonComponent;

        } catch (e) {
            console.error('Error rendering lesson content:', e);
            setError(e instanceof Error ? `${e.name}: ${e.message}` : 'An unknown error occurred during rendering.');
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

    return RenderedComponent ? <Suspense fallback={<div>Loading Lesson...</div>}>{React.createElement(RenderedComponent)}</Suspense> : <div className="text-center p-8">Preparing lesson...</div>;
};

// Define a more specific type for the Babel object to satisfy the linter
interface BabelTransformResult {
    code: string | null;
}

interface Babel {
    transform(code: string, options?: object): BabelTransformResult;
}

// We need to declare Babel on the window object for TypeScript to not throw an error
declare global {
    interface Window {
        Babel: Babel;
    }
}

